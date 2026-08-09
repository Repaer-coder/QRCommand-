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

export function hasWorkspaceRole(role: WorkspaceRole, minimum: WorkspaceRole) {
  return roleRank[role] >= roleRank[minimum];
}

export function canManageBilling(role: WorkspaceRole) {
  return role === 'owner' || role === 'admin';
}

export async function getWorkspaceContext(
  supabase: SupabaseClient
): Promise<WorkspaceContext | { error: string }> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user?.id) return { error: 'You must be signed in.' };

  await supabase.rpc('claim_workspace_invites');

  type OrganizationRow = {
    id: string;
    name: string;
    plan: string | null;
    stripe_customer_id: string | null;
    business_type: string | null;
    onboarding_completed_at: string | null;
  };

  let workspace: (OrganizationRow & { role: WorkspaceRole }) | null = null;
  const { data: owned } = await supabase
    .from('organizations')
    .select('id,name,plan,stripe_customer_id,business_type,onboarding_completed_at')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (owned) workspace = { ...(owned as OrganizationRow), role: 'owner' };

  if (!workspace) {
    const { data: membership, error: memberError } = await supabase
      .from('organization_members')
      .select('organization_id,role')
      .eq('user_id', user.id)
      .order('joined_at', { ascending: true })
      .limit(1)
      .maybeSingle();
    if (memberError) return { error: memberError.message };

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
    const workspaceName = `${(user.email || 'Business').split('@')[0]} Workspace`;
    const created = await supabase
      .from('organizations')
      .insert({ name: workspaceName, owner_id: user.id })
      .select('id,name,plan,stripe_customer_id,business_type,onboarding_completed_at')
      .single();
    if (created.error || !created.data) {
      return { error: created.error?.message ?? 'Could not initialize workspace.' };
    }
    workspace = { ...(created.data as OrganizationRow), role: 'owner' };
    const memberResult = await supabase.from('organization_members').upsert(
      {
        organization_id: workspace.id,
        user_id: user.id,
        email: user.email?.toLowerCase() ?? null,
        role: 'owner',
      },
      { onConflict: 'organization_id,user_id' }
    );
    if (memberResult.error) return { error: memberResult.error.message };
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
