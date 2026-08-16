import { notFound, redirect } from 'next/navigation';
import DashboardSidebar from '@/components/dashboard-sidebar';
import LocationForm from '@/components/location-form';
import { createClient } from '@/lib/supabase/server';
import { getWorkspaceContext, hasWorkspaceRole } from '@/lib/workspace';
import { getServerI18n } from '@/lib/i18n/page';

export default async function EditLocationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const context = await getWorkspaceContext(supabase);
  const { t } = await getServerI18n();
  if ('error' in context) return null;
  if (!hasWorkspaceRole(context.organization.role, 'manager')) redirect('/dashboard/locations');
  const { data: location } = await supabase.from('locations').select('id,name,address').eq('id', id).eq('organization_id', context.organization.id).maybeSingle();
  if (!location) notFound();
  return (
    <div className="shell">
      <DashboardSidebar active="locations" userLabel={context.email} role={context.organization.role} workspaceName={context.organization.name} plan={context.organization.plan} />
      <main className="main">
        <div className="toprow">
          <div>
            <div className="eyebrow">{t('dashboard.locations.title')}</div>
            <h1>{t('dashboard.locations.editTitle')} {location.name}</h1>
          </div>
        </div>
        <LocationForm location={location} />
      </main>
    </div>
  );
}
