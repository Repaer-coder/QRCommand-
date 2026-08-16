import { redirect } from 'next/navigation';
import DashboardSidebar from '@/components/dashboard-sidebar';
import SettingsForm from '@/components/settings-form';
import { getServerI18n } from '@/lib/i18n/page';
import { createClient } from '@/lib/supabase/server';
import { getWorkspaceContext, hasWorkspaceRole } from '@/lib/workspace';

export default async function SettingsPage() {
  const supabase = await createClient();
  const context = await getWorkspaceContext(supabase);
  const { t } = await getServerI18n();

  if ('error' in context) return null;
  if (!hasWorkspaceRole(context.organization.role, 'admin')) redirect('/dashboard');

  return (
    <div className="shell">
      <DashboardSidebar
        active="settings"
        userLabel={context.email}
        role={context.organization.role}
        workspaceName={context.organization.name}
        plan={context.organization.plan}
      />
      <main className="main">
        <div className="toprow">
          <div>
            <div className="eyebrow">{t('dashboard.sidebar.accountSettings')}</div>
            <h1>{t('dashboard.settings.heading')}</h1>
            <p className="muted">{t('dashboard.settings.description')}</p>
          </div>
        </div>
        <SettingsForm name={context.organization.name} businessType={context.organization.business_type} />
      </main>
    </div>
  );
}
