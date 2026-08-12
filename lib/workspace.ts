import type { SupabaseClient } from '@supabase/supabase-js';
import { normalizePlan, type PlanName } from '@/lib/plans';
export { getPlanLabel, hasEntitlement, plans } from '@/lib/plans';

export const workspaceRoles = ['owner', 'admin', 'manager', 'member'] as const;
export type WorkspaceRole = (typeof workspaceRoles)[number];

const roleRank: Record<WorkspaceRole, number> = { member: 0, manager: 1, admin: 2, owner: 3 };

export interface WorkspaceContext {
  userId: string;
  email: string;
  organization: {
    id: string;
    name: string;
    plan: PlanName;
    stripe_customer_id: string | null;
    role: WorkspaceRole;
    business_type: string | null;
    onboarding_completed_at: string | null;
  };
}

export type WorkspaceBootstrapStage =
  | 'auth'
  | 'claim_workspace_invites'
  | 'owned_lookup'
  | 'membership_lookup'
  | 'ensure_my_workspace';

export interface WorkspaceContextError {
  authenticated: boolean;
  error: string;
  workspaceError: string;
  stage: WorkspaceBootstrapStage;
}

export type WorkspaceContextResult = WorkspaceContext | WorkspaceContextError;

export function hasWorkspaceRole(role: WorkspaceRole, minimum: WorkspaceRole) {
  return roleRank[role] >= roleRank[minimum];
}

export function canManageBilling(role: WorkspaceRole) {
  return role === 'owner' || role === 'admin';
}

export async function getWorkspaceContext(
  supabase: SupabaseClient
): Promise<WorkspaceContextResult> {
  const buildWorkspaceError = (
    authenticated: boolean,
    message: string,
    stage: WorkspaceBootstrapStage
  ): WorkspaceContextError => ({
    authenticated,
    error: message,
    workspaceError: message,
    stage,
  });

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user?.id) {
    return buildWorkspaceError(false, 'You must be signed in.', 'auth');
  }

  const claimWorkspaceResult = await supabase.rpc('claim_workspace_invites');
  if (claimWorkspaceResult.error) {
    return buildWorkspaceError(true, claimWorkspaceResult.error.message, 'claim_workspace_invites');
  }

  type OrganizationRow = {
    id: string;
    name: string;
    plan: string | null;
    stripe_customer_id: string | null;
    business_type: string | null;
    onboarding_completed_at: string | null;
  };

  let workspace: (OrganizationRow & { role: WorkspaceRole }) | null = null;
  const { data: owned, error: ownedError } = await supabase
    .from('organizations')
    .select('id,name,plan,stripe_customer_id,business_type,onboarding_completed_at')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();
  if (ownedError) return buildWorkspaceError(true, ownedError.message, 'owned_lookup');

  if (owned) workspace = { ...(owned as OrganizationRow), role: 'owner' };

  if (!workspace) {
    const { data: membership, error: memberError } = await supabase
      .from('organization_members')
      .select('organization_id,role')
      .eq('user_id', user.id)
      .order('joined_at', { ascending: true })
      .limit(1)
      .maybeSingle();
    if (memberError) return buildWorkspaceError(true, memberError.message, 'membership_lookup');

    if (membership?.organization_id) {
      const { data: org } = await supabase
        .from('organizations')
        .select('id,name,plan,stripe_customer_id,business_type,onboarding_completed_at')
        .eq('id', membership.organization_id)
        .maybeSingle();
      if (org) workspace = { ...(org as OrganizationRow), role: membership.role as WorkspaceRole };
    }
  }

  if (!workspace) {
    const ensureWorkspaceResult = await supabase.rpc('ensure_my_workspace');
    if (ensureWorkspaceResult.error) {
      return buildWorkspaceError(true, ensureWorkspaceResult.error.message, 'ensure_my_workspace');
    }

    let ensuredOrganizationId: string | null = null;
    if (typeof ensureWorkspaceResult.data === 'string') {
      ensuredOrganizationId = ensureWorkspaceResult.data;
    } else if (
      ensureWorkspaceResult.data &&
      typeof ensureWorkspaceResult.data === 'object' &&
      'organization_id' in ensureWorkspaceResult.data &&
      typeof ensureWorkspaceResult.data.organization_id === 'string'
    ) {
      ensuredOrganizationId = ensureWorkspaceResult.data.organization_id;
    } else if (
      ensureWorkspaceResult.data &&
      typeof ensureWorkspaceResult.data === 'object' &&
      'id' in ensureWorkspaceResult.data &&
      typeof ensureWorkspaceResult.data.id === 'string'
    ) {
      ensuredOrganizationId = ensureWorkspaceResult.data.id;
    }

    if (!ensuredOrganizationId) {
      return buildWorkspaceError(true, 'Could not initialize workspace.', 'ensure_my_workspace');
    }

    const { data: ensuredOrg } = await supabase
      .from('organizations')
      .select('id,name,plan,stripe_customer_id,business_type,onboarding_completed_at')
      .eq('id', ensuredOrganizationId)
      .maybeSingle();

    if (!ensuredOrg) {
      return buildWorkspaceError(true, 'Could not locate initialized workspace.', 'ensure_my_workspace');
    }

    workspace = { ...(ensuredOrg as OrganizationRow), role: 'owner' };
  }

  const effectivePlan = await getOrganizationPlan(supabase, workspace.id, workspace.plan);
  return {
    userId: user.id,
    email: user.email ?? '',
    organization: { ...workspace, plan: effectivePlan },
  };
}

async function getOrganizationPlan(
  supabase: SupabaseClient,
  organizationId: string,
  storedPlan: string | null
): Promise<PlanName> {
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('price_id,status')
    .eq('organization_id', organizationId)
    .in('status', ['active', 'trialing'])
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (subscription?.price_id) {
    const { resolvePlanFromPrice } = await import('@/lib/stripe');
    return resolvePlanFromPrice(subscription.price_id);
  }
  return normalizePlan(storedPlan);
}
