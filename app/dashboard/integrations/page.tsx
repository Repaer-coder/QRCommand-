import { redirect } from 'next/navigation';
import DashboardSidebar from '@/components/dashboard-sidebar';
import IntegrationManager from '@/components/integration-manager';
import { hasEntitlement } from '@/lib/plans';
import { createClient } from '@/lib/supabase/server';
import { getWorkspaceContext, hasWorkspaceRole } from '@/lib/workspace';
import { getServerI18n } from '@/lib/i18n/page';

export default async function IntegrationsPage() {
  const supabase = await createClient();
  const context = await getWorkspaceContext(supabase);
  const { t } = await getServerI18n();
  if ('error' in context) return null;
  if (!hasEntitlement(context.organization.plan, 'integrations.advanced')) redirect('/dashboard/billing');
  if (!hasWorkspaceRole(context.organization.role, 'admin')) redirect('/dashboard');
  const { data } = await supabase
    .from('integrations')
    .select('id,name,provider,status,config,last_tested_at,last_error')
    .eq('organization_id', context.organization.id)
    .order('created_at', { ascending: false });
  return (
    <div className="shell">
      <DashboardSidebar
        active="integrations"
        userLabel={context.email}
        role={context.organization.role}
        workspaceName={context.organization.name}
        plan={context.organization.plan}
      />
      <main className="main">
        <div className="toprow">
          <div>
            <div className="eyebrow">{t('dashboard.integrations.safeTitle')}</div>
            <h1>{t('dashboard.integrations.heading')}</h1>
            <p className="muted">{t('dashboard.integrations.description')}</p>
          </div>
        </div>
        <IntegrationManager integrations={data ?? []} />
      </main>
    </div>
  );
}
