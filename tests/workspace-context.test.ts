import type { SupabaseClient } from '@supabase/supabase-js';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getWorkspaceContext, type WorkspaceContext } from '@/lib/workspace';

type WorkspaceDatabaseResult<T> = {
  data: T;
  error: {
    message: string;
  } | null;
};

type QueryBuilderLike = {
  select: (...args: unknown[]) => QueryBuilderLike;
  eq: (...args: unknown[]) => QueryBuilderLike;
  order: (...args: unknown[]) => QueryBuilderLike;
  limit: (...args: unknown[]) => QueryBuilderLike;
  in: (...args: unknown[]) => QueryBuilderLike;
  maybeSingle: () => Promise<WorkspaceDatabaseResult<unknown>>;
  single: () => Promise<WorkspaceDatabaseResult<unknown>>;
  insert: (...args: unknown[]) => QueryBuilderLike;
  upsert: (...args: unknown[]) => Promise<WorkspaceDatabaseResult<unknown>>;
};

function createQueryBuilder(overrides: Partial<QueryBuilderLike> = {}): QueryBuilderLike {
  return {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
    insert: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockResolvedValue({ data: null, error: null }),
    ...overrides,
  };
}

describe('workspace bootstrap flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates an owner workspace and membership for a newly authenticated user', async () => {
    const organizationsLookup = createQueryBuilder();
    const organizationMembersLookup = createQueryBuilder();
    organizationMembersLookup.maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });

    const ensuredOrganization = createQueryBuilder();
    ensuredOrganization.maybeSingle = vi.fn().mockResolvedValue({
      data: {
        id: 'org-001',
        name: 'owner Workspace',
        plan: 'free',
        stripe_customer_id: null,
        business_type: null,
        onboarding_completed_at: null,
      },
      error: null,
    });

    const subscriptionLookup = createQueryBuilder();
    subscriptionLookup.maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });

    let organizationReads = 0;
    let memberReads = 0;

    const from = vi.fn((tableName: string): QueryBuilderLike => {
      if (tableName === 'organizations') {
        organizationReads += 1;
        return organizationReads === 1 ? organizationsLookup : ensuredOrganization;
      }
      if (tableName === 'organization_members') {
        memberReads += 1;
        return memberReads === 1 ? organizationMembersLookup : createQueryBuilder();
      }
      return subscriptionLookup;
    });

    const supabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: {
            user: { id: 'user-id', email: 'owner@example.com' },
          },
          error: null,
        }),
      },
      rpc: vi.fn().mockResolvedValue({
        data: 'org-001',
        error: null,
      }),
      from,
    } as unknown as SupabaseClient;

    const context = await getWorkspaceContext(supabase);
    expect('error' in context).toBe(false);

    const successContext = context as WorkspaceContext;
    expect(successContext.organization.role).toBe('owner');
    expect(successContext.organization.id).toBe('org-001');
    expect(successContext.organization.name).toBe('owner Workspace');
    expect(successContext.userId).toBe('user-id');

    expect(supabase.rpc).toHaveBeenCalledWith('ensure_my_workspace');
    expect(organizationsLookup.select).toHaveBeenCalledWith(
      'id,name,plan,stripe_customer_id,business_type,onboarding_completed_at'
    );
    expect(ensuredOrganization.eq).toHaveBeenCalledWith('id', 'org-001');
    expect(subscriptionLookup.maybeSingle).toHaveBeenCalledTimes(1);
  });
});
