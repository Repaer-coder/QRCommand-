import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { DELETE as deleteIntegration } from '@/app/api/integrations/route';
import { PATCH as patchAutomation } from '@/app/api/automations/route';
import { POST as postBlueprint } from '@/app/api/blueprints/route';
import { POST as postQr } from '@/app/api/qr/route';
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

type BasicQueryState = {
  eqCalls: Array<{ column: string; value: string }>;
};

function buildWorkspaceContext(overrides?: Partial<WorkspaceContext['organization']>): WorkspaceContext {
  return {
    userId: 'user-id',
    email: 'owner@example.com',
    organization: {
      id: 'org-id',
      name: 'Owner Workspace',
      plan: 'pro',
      stripe_customer_id: 'cus-test',
      business_type: null,
      onboarding_completed_at: new Date().toISOString(),
      role: 'admin',
      ...overrides,
    },
  };
}

function makeAutomationPatchQuery({ found = true }: { found?: boolean } = {}) {
  const eqCalls: BasicQueryState['eqCalls'] = [];
  let payload: { enabled?: boolean } | undefined;

  const query = {
    eq: vi.fn((column: string, value: string) => {
      eqCalls.push({ column, value });
      return query;
    }),
    select: vi.fn(() => query),
    maybeSingle: vi.fn(async () => {
      if (!found) return { data: null, error: null };
      return { data: { id: 'automation-id', enabled: Boolean(payload?.enabled) }, error: null };
    }),
    update: vi.fn((values: { enabled?: boolean }) => {
      payload = values;
      return query;
    }),
  };

  return { query, eqCalls, getPayload: () => payload, getEqCalls: () => [...eqCalls] };
}

function makeIntegrationDeleteQuery({ found = true }: { found?: boolean } = {}) {
  const eqCalls: BasicQueryState['eqCalls'] = [];

  const query = {
    eq: vi.fn((column: string, value: string) => {
      eqCalls.push({ column, value });
      return query;
    }),
    select: vi.fn(() => query),
    maybeSingle: vi.fn(async () => {
      if (!found) return { data: null, error: null };
      return { data: { id: 'integration-id' }, error: null };
    }),
    delete: vi.fn(() => query),
  };

  return { query, eqCalls, getEqCalls: () => [...eqCalls] };
}

describe('API mutation entitlement and scope hardening', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    createAdminClientMock.mockReset();
  });

  it('rejects downgraded users from updating automations', async () => {
    const automationPatch = makeAutomationPatchQuery();
    createClientMock.mockResolvedValue({
      from: vi.fn((table: string) => {
        if (table === 'automation_rules') return automationPatch.query;
        return {};
      }),
    } as never);

    getWorkspaceContextMock.mockResolvedValue(
      buildWorkspaceContext({
        id: 'org-id',
        plan: 'premium',
        role: 'manager',
      })
    );

    const response = await patchAutomation(
      new NextRequest('https://app.example.com/api/automations', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ id: '123e4567-e89b-12d3-a456-426614174001', enabled: true }),
      })
    );

    expect(response.status).toBe(403);
    const payload = await response.json();
    expect(payload).toEqual({ error: 'Automation requires Pro or higher.' });
    expect(automationPatch.eqCalls).toEqual([]);
  });

  it('rejects downgraded users from deleting integrations', async () => {
    const deleteIntegrationQuery = makeIntegrationDeleteQuery();
    createClientMock.mockResolvedValue({
      from: vi.fn((table: string) => {
        if (table === 'integrations') return deleteIntegrationQuery.query;
        return {};
      }),
    } as never);

    getWorkspaceContextMock.mockResolvedValue(
      buildWorkspaceContext({
        id: 'org-id',
        plan: 'premium',
        role: 'admin',
      })
    );

    const response = await deleteIntegration(
      new NextRequest('https://app.example.com/api/integrations?id=123e4567-e89b-12d3-a456-426614174002', {
        method: 'DELETE',
      })
    );

    expect(response.status).toBe(403);
    const payload = await response.json();
    expect(payload).toEqual({ error: 'Integrations require Pro or higher.' });
    expect(deleteIntegrationQuery.eqCalls).toEqual([]);
  });

  it('prevents cross-organization integration deletion', async () => {
    const deleteIntegrationQuery = makeIntegrationDeleteQuery({ found: false });
    createClientMock.mockResolvedValue({
      from: vi.fn((table: string) => {
        if (table === 'integrations') return deleteIntegrationQuery.query;
        return {};
      }),
    } as never);

    getWorkspaceContextMock.mockResolvedValue(buildWorkspaceContext({ id: 'org-id', role: 'admin', plan: 'pro' }));

    const response = await deleteIntegration(
      new NextRequest('https://app.example.com/api/integrations?id=123e4567-e89b-12d3-a456-426614174003', {
        method: 'DELETE',
      })
    );

    expect(response.status).toBe(404);
    const payload = await response.json();
    expect(payload).toEqual({ error: 'Integration not found.' });
    expect(deleteIntegrationQuery.getEqCalls()).toEqual([
      { column: 'id', value: '123e4567-e89b-12d3-a456-426614174003' },
      { column: 'organization_id', value: 'org-id' },
    ]);
  });

  it('blocks unpaid workspace from mutating paid QR feature via API', async () => {
    const query = {
      select: vi.fn(() => query),
      eq: vi.fn(() => query),
      neq: vi.fn(() => ({ count: 0, error: null })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(),
        })),
      })),
    };

    createClientMock.mockResolvedValue({ from: vi.fn(() => query) } as never);
    getWorkspaceContextMock.mockResolvedValue(
      buildWorkspaceContext({
        id: 'org-id',
        plan: 'free',
        role: 'owner',
      })
    );

    const response = await postQr(
      new NextRequest('https://app.example.com/api/qr', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name: 'Starter campaign',
          type: 'social',
          destinationUrl: 'https://example.com/welcome',
          slug: 'starter-campaign',
          style: {
            fg: '#07111f',
            bg: '#ffffff',
          },
        }),
      })
    );

    expect(response.status).toBe(403);
    const payload = await response.json();
    expect(payload).toEqual({ error: 'QR creation is unavailable on this plan.' });
    expect(query.insert).not.toHaveBeenCalled();
  });

  it('requires authorization checks before service-role access for blueprint writes', async () => {
    createClientMock.mockResolvedValue({} as never);
    getWorkspaceContextMock.mockResolvedValue(
      buildWorkspaceContext({
        plan: 'free',
        role: 'manager',
      })
    );

    const response = await postBlueprint(
      new NextRequest('https://app.example.com/api/blueprints', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ templateKey: 'blueprints-reputation' }),
      })
    );

    expect(response.status).toBe(403);
    const payload = await response.json();
    expect(payload).toEqual({ error: 'Growth blueprints require Premium or higher.' });
    expect(createAdminClientMock).not.toHaveBeenCalled();
  });

  it('does not perform service-role writes when admin credentials are missing', async () => {
    getWorkspaceContextMock.mockResolvedValue(
      buildWorkspaceContext({
        id: 'org-id',
        plan: 'premium',
        role: 'manager',
      })
    );
    createClientMock.mockResolvedValue({} as never);
    createAdminClientMock.mockReturnValue(null);

    const response = await postBlueprint(
      new NextRequest('https://app.example.com/api/blueprints', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ templateKey: 'blueprints-reputation' }),
      })
    );

    expect(response.status).toBe(503);
    const payload = await response.json();
    expect(payload).toEqual({ error: 'SUPABASE_SERVICE_ROLE_KEY is required for blueprint writes.' });
    expect(createAdminClientMock).toHaveBeenCalledTimes(1);
  });
});
