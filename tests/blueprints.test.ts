import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { PATCH, POST } from '@/app/api/blueprints/route';
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
  status: BlueprintStatus;
};

type BlueprintAdminClientMock = {
  fromMock: ReturnType<typeof vi.fn>;
  getInsertedPayload: () => BlueprintInsertPayload | null;
  getUpdateFilters: () => Array<{ column: string; value: string }>;
  getUpdatePayload: () => BlueprintUpdatePayload | null;
};

function createBlueprintAdminClientMock(overrides?: { patchFound?: boolean }) {
  let insertedPayload: BlueprintInsertPayload | null = null;
  let updatePayload: BlueprintUpdatePayload | null = null;
  const updateFilters: Array<{ column: string; value: string }> = [];
  const patchFound = overrides?.patchFound !== false;

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
        const query = {
          eq: (column: string, value: string) => {
            updateFilters.push({ column, value });
            return query;
          },
          select: () => ({
            maybeSingle: async () =>
              patchFound
                ? {
                    data: {
                      id: 'blueprint-instance-id',
                      status: payload.status,
                    },
                    error: null,
                  }
                : {
                    data: null,
                    error: null,
                  },
          }),
        };
        return query;
      },
    };
  });

  return {
    fromMock,
    getInsertedPayload: () => insertedPayload,
    getUpdateFilters: () => [...updateFilters],
    getUpdatePayload: () => updatePayload,
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

  it('allows owners to create a growth blueprint and writes through server-admin client', async () => {
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

  it('allows managers to create a growth blueprint from catalog metadata', async () => {
    getWorkspaceContextMock.mockResolvedValue(premiumWorkspaceContext('manager'));
    const template = blueprintTemplates[1];
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

  it('rejects non-managers from creating growth blueprints', async () => {
    getWorkspaceContextMock.mockResolvedValue(premiumWorkspaceContext('member'));
    createAdminClientMock.mockReturnValue({} as unknown as ReturnType<typeof createAdminClient>);
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
    expect(payload).toEqual({ error: 'Manager access is required.' });
    expect(createAdminClientMock).not.toHaveBeenCalled();
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

  it('does not update blueprints outside the authenticated organization', async () => {
    const { fromMock, getUpdateFilters, getUpdatePayload } = createBlueprintAdminClientMock();
    getWorkspaceContextMock.mockResolvedValue(premiumWorkspaceContext('manager'));
    createAdminClientMock.mockReturnValue({ from: fromMock } as unknown as ReturnType<typeof createAdminClient>);
    createClientMock.mockResolvedValue({} as Awaited<ReturnType<typeof createClient>>);

    const response = await PATCH(
      new NextRequest('https://app.example.com/api/blueprints', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ id: '123e4567-e89b-12d3-a456-426614174000', status: 'active' }),
      })
    );

    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload).toEqual({ id: 'blueprint-instance-id', status: 'active' });
    expect(getUpdatePayload()).toEqual({ status: 'active' });
    expect(getUpdateFilters()).toEqual([
      { column: 'id', value: '123e4567-e89b-12d3-a456-426614174000' },
      { column: 'organization_id', value: 'org-id' },
    ]);
  });

  it('returns not found for a blueprint not in the authenticated organization', async () => {
    const { fromMock, getUpdateFilters, getUpdatePayload } = createBlueprintAdminClientMock({ patchFound: false });
    getWorkspaceContextMock.mockResolvedValue(premiumWorkspaceContext('manager'));
    createAdminClientMock.mockReturnValue({ from: fromMock } as unknown as ReturnType<typeof createAdminClient>);
    createClientMock.mockResolvedValue({} as Awaited<ReturnType<typeof createClient>>);

    const response = await PATCH(
      new NextRequest('https://app.example.com/api/blueprints', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ id: '123e4567-e89b-12d3-a456-426614174001', status: 'paused' }),
      })
    );

    expect(response.status).toBe(404);
    const payload = await response.json();
    expect(payload).toEqual({ error: 'Blueprint not found.' });
    expect(getUpdatePayload()).toEqual({ status: 'paused' });
    expect(getUpdateFilters()).toEqual([
      { column: 'id', value: '123e4567-e89b-12d3-a456-426614174001' },
      { column: 'organization_id', value: 'org-id' },
    ]);
  });
});
