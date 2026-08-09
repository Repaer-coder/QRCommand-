import { redirect } from 'next/navigation';
import DashboardSidebar from '@/components/dashboard-sidebar';
import LocationForm from '@/components/location-form';
import { createClient } from '@/lib/supabase/server';
import { getWorkspaceContext, hasWorkspaceRole } from '@/lib/workspace';

export default async function NewLocationPage() {
  const supabase = await createClient();
  const context = await getWorkspaceContext(supabase);
  if ('error' in context) return null;
  if (!hasWorkspaceRole(context.organization.role, 'manager')) redirect('/dashboard/locations');
  return <div className="shell"><DashboardSidebar active="locations" userLabel={context.email} role={context.organization.role} workspaceName={context.organization.name} plan={context.organization.plan} /><main className="main"><div className="toprow"><div><div className="eyebrow">Location operations</div><h1>Add a business location</h1><p className="muted">Campaigns can be assigned to this location as soon as it is saved.</p></div></div><LocationForm /></main></div>;
}
