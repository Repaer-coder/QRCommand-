import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/blueprints/route';
import { blueprintTemplates, filterBlueprintTemplates, getBlueprintIndustries, getBlueprintOutcomes } from '@/lib/blueprints';
import { createClient } from '@/lib/supabase/server';
import type { WorkspaceContext } from '@/lib/workspace';
import { getWorkspaceContext } from '@/lib/workspace';

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

vi.mock('@/lib/workspace', () => ({
  getWorkspaceContext: vi.fn(),
  hasWorkspaceRole: vi.fn(() => true),
}));

const createClientMock = vi.mocked(createClient);
const getWorkspaceContextMock = vi.mocked(getWorkspaceContext);

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

function createBlueprintClientMock() {
  let insertedPayload: BlueprintInsertPayload | null = null;

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
    };
  });

  return {
    fromMock,
    getInsertedPayload: () => insertedPayload,
  };
}

function premiumWorkspaceContext(): WorkspaceContext {
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
      role: 'owner' as const,
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

  it('creates a blueprint from catalog metadata', async () => {
    getWorkspaceContextMock.mockResolvedValue(premiumWorkspaceContext());
    const template = blueprintTemplates[0];
    const { fromMock, getInsertedPayload } = createBlueprintClientMock();
    createClientMock.mockResolvedValue({ from: fromMock } as unknown as Awaited<ReturnType<typeof createClient>>);

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

  it('rejects unknown template keys', async () => {
    getWorkspaceContextMock.mockResolvedValue(premiumWorkspaceContext());
    const { fromMock } = createBlueprintClientMock();
    createClientMock.mockResolvedValue({ from: fromMock } as unknown as Awaited<ReturnType<typeof createClient>>);

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
    const { fromMock } = createBlueprintClientMock();
    createClientMock.mockResolvedValue({ from: fromMock } as unknown as Awaited<ReturnType<typeof createClient>>);

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
