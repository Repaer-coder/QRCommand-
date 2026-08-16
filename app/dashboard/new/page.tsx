import Link from 'next/link';
import QRCreator from '@/components/qr-creator';
import DashboardSidebar from '@/components/dashboard-sidebar';
import { createClient } from '@/lib/supabase/server';
import { getWorkspaceContext } from '@/lib/workspace';
import { getServerI18n } from '@/lib/i18n/page';

export default async function NewQR({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
  const params = await searchParams;
  const supabase = await createClient();
  const context = await getWorkspaceContext(supabase);
  const { t } = await getServerI18n();
  if ('error' in context) return null;
  const { data: locations } = await supabase.from('locations').select('id,name').eq('organization_id', context.organization.id).order('name');
  return (
    <div className="shell">
      <DashboardSidebar active="library" userLabel={context.email} role={context.organization.role} workspaceName={context.organization.name} plan={context.organization.plan} />
      <main className="main">
        <div className="toprow">
          <div>
            <div className="eyebrow">{t('dashboard.qrLibrary.newCampaign')}</div>
            <h1>{t('qr.builder.dynamicCampaign')}</h1>
            <p className="muted">{t('qr.creatorDescription')}</p>
          </div>
          <Link href="/dashboard/qr-codes" className="btn secondary">
            {t('dashboard.qrLibrary.openLibrary')}
          </Link>
        </div>
        <QRCreator locations={locations ?? []} initialType={params.type} />
      </main>
    </div>
  );
}
