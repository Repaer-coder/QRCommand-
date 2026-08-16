import { redirect } from 'next/navigation';
import DashboardSidebar from '@/components/dashboard-sidebar';
import AutomationManager from '@/components/automation-manager';
import { hasEntitlement } from '@/lib/plans';
import { createClient } from '@/lib/supabase/server';
import { getWorkspaceContext } from '@/lib/workspace';
import { getServerI18n } from '@/lib/i18n/page';

export default async function AutomationPage() {
  const supabase = await createClient();
  const context = await getWorkspaceContext(supabase);
  const { t } = await getServerI18n();
  if ('error' in context) return null;
  if (!hasEntitlement(context.organization.plan, 'automation.engine')) redirect('/dashboard/billing');

  const [{ data: rules }, { data: runs }, { data: campaigns }, { data: integrations }] = await Promise.all([
    supabase.from('automation_rules').select('id,name,trigger_type,action_type,enabled,last_run_at').eq('organization_id', context.organization.id).order('created_at', { ascending: false }),
    supabase.from('automation_runs').select('id,rule_id,status,error,started_at').eq('organization_id', context.organization.id).order('started_at', { ascending: false }).limit(20),
    supabase.from('qr_codes').select('id,name').eq('organization_id', context.organization.id).neq('status', 'archived').order('name'),
    supabase.from('integrations').select('id,name').eq('organization_id', context.organization.id).eq('status', 'connected').order('name'),
  ]);

  return (
    <div className="shell">
      <DashboardSidebar active="automation" userLabel={context.email} role={context.organization.role} workspaceName={context.organization.name} plan={context.organization.plan} />
      <main className="main">
        <div className="toprow">
          <div>
            <div className="eyebrow">{t('dashboard.automation.title')}</div>
            <h1>{t('dashboard.automation.heading')}</h1>
            <p className="muted">{t('dashboard.automation.description')}</p>
          </div>
        </div>
        <AutomationManager rules={rules ?? []} runs={runs ?? []} campaigns={campaigns ?? []} integrations={integrations ?? []} />
      </main>
    </div>
  );
}
