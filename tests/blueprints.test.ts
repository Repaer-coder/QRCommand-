import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { DELETE, PATCH, POST } from '@/app/api/blueprints/route';
import { blueprintTemplates, filterBlueprintTemplates, getBlueprintIndustries, getBlueprintOutcomes } from '@/lib/blueprints';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { getWorkspaceContext, type WorkspaceContext } from '@/lib/workspace';

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('@/lib/workspace', async () => {
  const actual = await vi.importActual<typeof import('@/lib/workspace')>('@/lib/workspace');
  return { ...actual, getWorkspaceContext: vi.fn() };
});

const createClientMock = vi.mocked(createClient);
const createAdminClientMock = vi.mocked(createAdminClient);
const getWorkspaceContextMock = vi.mocked(getWorkspaceContext);

type BlueprintStatus = 'draft' | 'active' | 'paused' | 'completed';

type BlueprintInsertPayload = {
  organization_id: string;
  template_key: string;
  name: string;
  configuration: {
    outcome: string;
    checklist: string[];
  };
  created_by: string;
};

type BlueprintUpdatePayload = {
  name?: string;
  status?: BlueprintStatus;
  configuration?: {
    [key: string]: unknown;
  };
};

type RecordedFilter = {
  column: string;
  value: string;
};

type BlueprintAdminClientMock = {
  fromMock: ReturnType<typeof vi.fn>;
  getInsertedPayload: () => BlueprintInsertPayload | null;
  getUpdatePayload: () => BlueprintUpdatePayload | null;
  getUpdateFilters: () => RecordedFilter[];
  getConfigFilters: () => RecordedFilter[];
  getDeleteFilters: () => RecordedFilter[];
};

function createBlueprintAdminClientMock(overrides?: {
  existingConfiguration?: Record<string, unknown>;
  configFound?: boolean;
  patchFound?: boolean;
  deleteFound?: boolean;
}) {
  let insertedPayload: BlueprintInsertPayload | null = null;
  let updatePayload: BlueprintUpdatePayload | null = null;

  const updateFilters: RecordedFilter[] = [];
  const configFilters: RecordedFilter[] = [];
  const deleteFilters: RecordedFilter[] = [];

  const configFound = overrides?.configFound !== false;
  const patchFound = overrides?.patchFound !== false;
  const deleteFound = overrides?.deleteFound !== false;
  const existingConfiguration =
    overrides?.existingConfiguration ?? {
      outcome: 'Template outcome',
      checklist: ['Existing checklist step'],
      notes: {
        hidden: true,
      },
    };

  const makeQuery = (mode: 'config' | 'update' | 'delete') => {
    const filters = mode === 'config' ? configFilters : mode === 'update' ? updateFilters : deleteFilters;

    const query = {
      eq(column: string, value: string) {
        filters.push({ column, value });
        return query;
      },
      select() {
        return query;
      },
      maybeSingle: vi.fn(async () => {
        if (mode === 'config') {
          if (!configFound) return { data: null, error: null };
          return {
            data: {
              configuration: existingConfiguration,
            },
            error: null,
          };
        }

        if (mode === 'update') {
          if (!patchFound) return { data: null, error: null };
          return {
            data: {
              id: 'blueprint-instance-id',
              name: updatePayload?.name || 'Blueprint Name',
              status: updatePayload?.status || 'draft',
            },
            error: null,
          };
        }

        return {
          data: deleteFound ? { id: 'blueprint-instance-id' } : null,
          error: null,
        };
      }),
      single: vi.fn(async () => ({
        data: {
          id: 'blueprint-instance-id',
          name: insertedPayload?.name || 'Blueprint Name',
          status: 'draft',
        },
        error: null,
      })),
      then() {
        return query;
      },
    };

    return query as {
      eq: (column: string, value: string) => typeof query;
      select: () => typeof query;
      maybeSingle: () => Promise<{ data: unknown; error: unknown }>;
      single: () => Promise<{ data: unknown; error: unknown }>;
      then: () => void;
    };
  };

  const fromMock = vi.fn((table: string) => {
    if (table !== 'blueprint_instances') return {};

    return {
      insert(payload: BlueprintInsertPayload) {
        insertedPayload = payload;
        return {
          select: vi.fn(() => ({
            single: vi.fn(async () => ({
              data: {
                id: 'blueprint-instance-id',
                name: payload.name,
                status: 'draft',
              },
              error: null,
            })),
          })),
        };
      },
      update(payload: BlueprintUpdatePayload) {
        updatePayload = payload;
        return makeQuery('update');
      },
      select() {
        return makeQuery('config');
      },
      delete() {
        return makeQuery('delete');
      },
    };
  });

  return {
    fromMock,
    getInsertedPayload: () => insertedPayload,
    getUpdatePayload: () => updatePayload,
    getUpdateFilters: () => [...updateFilters],
    getConfigFilters: () => [...configFilters],
    getDeleteFilters: () => [...deleteFilters],
  } satisfies BlueprintAdminClientMock;
}

function premiumWorkspaceContext(role: WorkspaceContext['organization']['role'] = 'owner'): WorkspaceContext {
  return {
    userId: 'user-id',
    email: 'owner@example.com',
    organization: {
      id: 'org-id',
      name: 'Owner Workspace',
      plan: 'premium',
      stripe_customer_id: null,
      business_type: null,
      onboarding_completed_at: new Date().toISOString(),
      role,
    },
  };
}

describe('growth blueprint catalog', () => {
  it('ships at least 16 industry-specific blueprint templates', () => {
    expect(blueprintTemplates.length).toBeGreaterThanOrEqual(16);
    expect(getBlueprintIndustries().length).toBeGreaterThanOrEqual(10);
  });

  it('uses unique template keys for reliable template lookup', () => {
    const keys = blueprintTemplates.map((template) => template.key);
    const unique = new Set(keys);
    expect(unique.size).toBe(keys.length);
  });

  it('filters templates by name, industry, and outcome', () => {
    expect(filterBlueprintTemplates({ search: 'revenue' }).length).toBeGreaterThan(0);
    expect(filterBlueprintTemplates({ industry: 'Restaurants' }).every((template) => template.industry === 'Restaurants')).toBe(true);
    const firstOutcome = getBlueprintOutcomes()[0];
    expect(
      filterBlueprintTemplates({ outcome: firstOutcome }).every((template) => template.outcome.toLowerCase() === firstOutcome.toLowerCase())
    ).toBe(true);
  });
});

describe('growth blueprint API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates a growth blueprint from template metadata and stores organization/user correctly', async () => {
    getWorkspaceContextMock.mockResolvedValue(premiumWorkspaceContext('owner'));
    const template = blueprintTemplates[0];
    const { fromMock, getInsertedPayload } = createBlueprintAdminClientMock();
    createAdminClientMock.mockReturnValue({ from: fromMock } as unknown as ReturnType<typeof createAdminClient>);
    createClientMock.mockResolvedValue({} as Awaited<ReturnType<typeof createClient>>);

    const response = await POST(
      new NextRequest('https://app.example.com/api/blueprints', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ templateKey: template.key }),
      })
    );

    const payload = await response.json();
    expect(response.status).toBe(201);
    expect(payload).toEqual({
      id: 'blueprint-instance-id',
      name: template.name,
      status: 'draft',
    });

    const insertedPayload = getInsertedPayload();
    expect(insertedPayload).toEqual({
      organization_id: 'org-id',
      template_key: template.key,
      name: template.name,
      configuration: { outcome: template.outcome, checklist: template.items },
      created_by: 'user-id',
    });
  });

  it('updates an existing blueprint name during configure', async () => {
    const { fromMock, getUpdatePayload, getUpdateFilters } = createBlueprintAdminClientMock({ configFound: false });
    getWorkspaceContextMock.mockResolvedValue(premiumWorkspaceContext('manager'));
    createAdminClientMock.mockReturnValue({ from: fromMock } as unknown as ReturnType<typeof createAdminClient>);
    createClientMock.mockResolvedValue({} as Awaited<ReturnType<typeof createClient>>);

    const response = await PATCH(
      new NextRequest('https://app.example.com/api/blueprints', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ id: '123e4567-e89b-12d3-a456-426614174000', name: 'Updated playbook name', status: 'active' }),
      })
    );

    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload).toEqual({
      id: 'blueprint-instance-id',
      name: 'Updated playbook name',
      status: 'active',
    });
    expect(getUpdatePayload()).toEqual({
      name: 'Updated playbook name',
      status: 'active',
    });
    expect(getUpdateFilters()).toEqual([
      { column: 'id', value: '123e4567-e89b-12d3-a456-426614174000' },
      { column: 'organization_id', value: 'org-id' },
    ]);
  });

  it('updates checklist while preserving existing configuration properties', async () => {
    const existingConfiguration = {
      outcome: 'Test outcome',
      checklist: ['Old item'],
      notes: {
        channel: 'qr',
      },
      metadata: {
        createdFromTemplate: true,
      },
    };
    const { fromMock, getUpdatePayload } = createBlueprintAdminClientMock({ existingConfiguration, configFound: true });
    getWorkspaceContextMock.mockResolvedValue(premiumWorkspaceContext('manager'));
    createAdminClientMock.mockReturnValue({ from: fromMock } as unknown as ReturnType<typeof createAdminClient>);
    createClientMock.mockResolvedValue({} as Awaited<ReturnType<typeof createClient>>);

    const response = await PATCH(
      new NextRequest('https://app.example.com/api/blueprints', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          id: '123e4567-e89b-12d3-a456-426614174002',
          checklist: ['Step one', 'Step two'],
        }),
      })
    );

    expect(response.status).toBe(200);
    await response.json();

    expect(getUpdatePayload()).toEqual({
      configuration: {
        outcome: 'Test outcome',
        notes: {
          channel: 'qr',
        },
        metadata: {
          createdFromTemplate: true,
        },
        checklist: ['Step one', 'Step two'],
      },
    });
  });

  it('supports status-only configure updates', async () => {
    const { fromMock, getUpdatePayload, getUpdateFilters } = createBlueprintAdminClientMock({ configFound: false });
    getWorkspaceContextMock.mockResolvedValue(premiumWorkspaceContext('manager'));
    createAdminClientMock.mockReturnValue({ from: fromMock } as unknown as ReturnType<typeof createAdminClient>);
    createClientMock.mockResolvedValue({} as Awaited<ReturnType<typeof createClient>>);

    const response = await PATCH(
      new NextRequest('https://app.example.com/api/blueprints', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ id: '123e4567-e89b-12d3-a456-426614174003', status: 'completed' }),
      })
    );

    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload).toEqual({
      id: 'blueprint-instance-id',
      name: 'Blueprint Name',
      status: 'completed',
    });

    expect(getUpdatePayload()).toEqual({
      status: 'completed',
    });
    expect(getUpdateFilters()).toEqual([
      { column: 'id', value: '123e4567-e89b-12d3-a456-426614174003' },
      { column: 'organization_id', value: 'org-id' },
    ]);
  });

  it('returns not found when updating a blueprint outside the authenticated organization', async () => {
    const { fromMock, getConfigFilters } = createBlueprintAdminClientMock({ configFound: false });
    getWorkspaceContextMock.mockResolvedValue(premiumWorkspaceContext('manager'));
    createAdminClientMock.mockReturnValue({ from: fromMock } as unknown as ReturnType<typeof createAdminClient>);
    createClientMock.mockResolvedValue({} as Awaited<ReturnType<typeof createClient>>);

    const response = await PATCH(
      new NextRequest('https://app.example.com/api/blueprints', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          id: '123e4567-e89b-12d3-a456-426614174004',
          checklist: ['Should not be allowed'],
        }),
      })
    );

    expect(response.status).toBe(404);
    const payload = await response.json();
    expect(payload).toEqual({ error: 'Blueprint not found.' });
    expect(getConfigFilters()).toEqual([
      { column: 'id', value: '123e4567-e89b-12d3-a456-426614174004' },
      { column: 'organization_id', value: 'org-id' },
    ]);
  });

  it('deletes a workspace playbook', async () => {
    const { fromMock, getDeleteFilters } = createBlueprintAdminClientMock({ deleteFound: true });
    getWorkspaceContextMock.mockResolvedValue(premiumWorkspaceContext('manager'));
    createAdminClientMock.mockReturnValue({ from: fromMock } as unknown as ReturnType<typeof createAdminClient>);
    createClientMock.mockResolvedValue({} as Awaited<ReturnType<typeof createClient>>);

    const response = await DELETE(
      new NextRequest('https://app.example.com/api/blueprints', {
        method: 'DELETE',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ id: '123e4567-e89b-12d3-a456-426614174005' }),
      })
    );

    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload).toEqual({ id: 'blueprint-instance-id' });
    expect(getDeleteFilters()).toEqual([
      { column: 'id', value: '123e4567-e89b-12d3-a456-426614174005' },
      { column: 'organization_id', value: 'org-id' },
    ]);
  });

  it('prevents deleting playbooks outside the authenticated organization', async () => {
    const { fromMock, getDeleteFilters } = createBlueprintAdminClientMock({ deleteFound: false });
    getWorkspaceContextMock.mockResolvedValue(premiumWorkspaceContext('manager'));
    createAdminClientMock.mockReturnValue({ from: fromMock } as unknown as ReturnType<typeof createAdminClient>);
    createClientMock.mockResolvedValue({} as Awaited<ReturnType<typeof createClient>>);

    const response = await DELETE(
      new NextRequest('https://app.example.com/api/blueprints', {
        method: 'DELETE',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ id: '123e4567-e89b-12d3-a456-426614174006' }),
      })
    );

    expect(response.status).toBe(404);
    const payload = await response.json();
    expect(payload).toEqual({ error: 'Blueprint not found.' });
    expect(getDeleteFilters()).toEqual([
      { column: 'id', value: '123e4567-e89b-12d3-a456-426614174006' },
      { column: 'organization_id', value: 'org-id' },
    ]);
  });

  it('requires manager role for blueprint updates', async () => {
    getWorkspaceContextMock.mockResolvedValue(premiumWorkspaceContext('member'));
    createAdminClientMock.mockReturnValue({} as unknown as ReturnType<typeof createAdminClient>);
    createClientMock.mockResolvedValue({} as Awaited<ReturnType<typeof createClient>>);

    const patchResponse = await PATCH(
      new NextRequest('https://app.example.com/api/blueprints', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ id: '123e4567-e89b-12d3-a456-426614174007', status: 'active' }),
      })
    );

    expect(patchResponse.status).toBe(403);
    const patchPayload = await patchResponse.json();
    expect(patchPayload).toEqual({ error: 'Manager access is required.' });
    expect(createAdminClientMock).not.toHaveBeenCalled();

    const deleteResponse = await DELETE(
      new NextRequest('https://app.example.com/api/blueprints', {
        method: 'DELETE',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ id: '123e4567-e89b-12d3-a456-426614174007' }),
      })
    );

    expect(deleteResponse.status).toBe(403);
    const deletePayload = await deleteResponse.json();
    expect(deletePayload).toEqual({ error: 'Manager access is required.' });
    expect(createAdminClientMock).toHaveBeenCalledTimes(0);
  });

  it('requires blueprint entitlement for update and delete', async () => {
    getWorkspaceContextMock.mockResolvedValue({
      ...premiumWorkspaceContext(),
      organization: {
        ...premiumWorkspaceContext().organization,
        plan: 'free',
      },
    });
    createAdminClientMock.mockReturnValue({} as unknown as ReturnType<typeof createAdminClient>);
    createClientMock.mockResolvedValue({} as Awaited<ReturnType<typeof createClient>>);

    const patchResponse = await PATCH(
      new NextRequest('https://app.example.com/api/blueprints', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ id: '123e4567-e89b-12d3-a456-426614174008', status: 'active' }),
      })
    );

    expect(patchResponse.status).toBe(403);
    const patchPayload = await patchResponse.json();
    expect(patchPayload).toEqual({ error: 'Growth blueprints require Premium or higher.' });

    const deleteResponse = await DELETE(
      new NextRequest('https://app.example.com/api/blueprints', {
        method: 'DELETE',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ id: '123e4567-e89b-12d3-a456-426614174009' }),
      })
    );

    expect(deleteResponse.status).toBe(403);
    const deletePayload = await deleteResponse.json();
    expect(deletePayload).toEqual({ error: 'Growth blueprints require Premium or higher.' });
  });

  it('returns a server configuration error when admin client is unavailable', async () => {
    getWorkspaceContextMock.mockResolvedValue(premiumWorkspaceContext());
    createAdminClientMock.mockReturnValue(null);
    createClientMock.mockResolvedValue({} as Awaited<ReturnType<typeof createClient>>);

    const response = await POST(
      new NextRequest('https://app.example.com/api/blueprints', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ templateKey: blueprintTemplates[0].key }),
      })
    );

    expect(response.status).toBe(503);
    const payload = await response.json();
    expect(payload).toEqual({ error: 'SUPABASE_SERVICE_ROLE_KEY is required for blueprint writes.' });
  });

  it('rejects unknown template keys', async () => {
    getWorkspaceContextMock.mockResolvedValue(premiumWorkspaceContext());
    const { fromMock } = createBlueprintAdminClientMock();
    createAdminClientMock.mockReturnValue({ from: fromMock } as unknown as ReturnType<typeof createAdminClient>);
    createClientMock.mockResolvedValue({} as Awaited<ReturnType<typeof createClient>>);

    const response = await POST(
      new NextRequest('https://app.example.com/api/blueprints', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ templateKey: 'does-not-exist' }),
      })
    );

    expect(response.status).toBe(400);
    const payload = await response.json();
    expect(payload).toEqual({ error: 'Unknown blueprint template.' });
  });

  it('requires premium workspace entitlement to create growth blueprints', async () => {
    getWorkspaceContextMock.mockResolvedValue({
      ...premiumWorkspaceContext(),
      organization: {
        ...premiumWorkspaceContext().organization,
        plan: 'free',
      },
    });
    createClientMock.mockResolvedValue({} as Awaited<ReturnType<typeof createClient>>);

    const response = await POST(
      new NextRequest('https://app.example.com/api/blueprints', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ templateKey: blueprintTemplates[0].key }),
      })
    );

    expect(response.status).toBe(403);
    const payload = await response.json();
    expect(payload).toEqual({ error: 'Growth blueprints require Premium or higher.' });
  });
});
