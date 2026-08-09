import { redirect } from 'next/navigation';
import DashboardSidebar from '@/components/dashboard-sidebar';
import TeamManager from '@/components/team-manager';
import { hasEntitlement } from '@/lib/plans';
import { createClient } from '@/lib/supabase/server';
import { getWorkspaceContext, hasWorkspaceRole } from '@/lib/workspace';

export default async function TeamPage() {
  const supabase = await createClient();
  const context = await getWorkspaceContext(supabase);
  if ('error' in context) return null;
  if (!hasEntitlement(context.organization.plan, 'team.manager')) redirect('/dashboard/billing');
  const [{ data: members, error }, { data: invitations }] = await Promise.all([
    supabase.from('organization_members').select('user_id,email,role,joined_at').eq('organization_id', context.organization.id).order('joined_at'),
    supabase.from('team_invitations').select('id,email,role,expires_at').eq('organization_id', context.organization.id).is('accepted_at', null).gt('expires_at', new Date().toISOString()).order('created_at'),
  ]);
  if (error) throw new Error(error.message);
  return <div className="shell"><DashboardSidebar active="team" userLabel={context.email} role={context.organization.role} workspaceName={context.organization.name} plan={context.organization.plan} /><main className="main"><div className="toprow"><div><div className="eyebrow">Role-based operations</div><h1>Workspace team</h1><p className="muted">Owners and admins govern access. Managers operate campaigns and locations. Members handle day-to-day campaign work.</p></div></div><TeamManager members={members ?? []} invitations={invitations ?? []} canManage={hasWorkspaceRole(context.organization.role, 'admin')} /></main></div>;
}
