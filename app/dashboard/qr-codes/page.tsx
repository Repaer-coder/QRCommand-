import Link from 'next/link';
import DashboardSidebar from '@/components/dashboard-sidebar';
import QRLibraryActions from '@/components/qr-library-actions';
import { createClient } from '@/lib/supabase/server';
import { getWorkspaceContext, hasWorkspaceRole } from '@/lib/workspace';
import { getServerI18n } from '@/lib/i18n/page';

const goalTypeOptions = [
  { value: 'all', labelKey: 'dashboard.qrLibrary.allGoals' },
  { value: 'restaurant', labelKey: 'qr.builder.goalRestaurant' },
  { value: 'reviews', labelKey: 'qr.builder.goalReviews' },
  { value: 'social', labelKey: 'qr.builder.goalSocial' },
  { value: 'website', labelKey: 'qr.builder.goalWebsite' },
  { value: 'lead', labelKey: 'qr.builder.goalLead' },
  { value: 'coupon', labelKey: 'qr.builder.goalCoupon' },
  { value: 'event', labelKey: 'qr.builder.goalEvent' },
  { value: 'wifi', labelKey: 'qr.builder.goalWifi' },
] as const;

function getStatusLabel(t: (key: string) => string, status: string) {
  if (status === 'active') return t('dashboard.qrLibrary.active');
  if (status === 'paused') return t('dashboard.qrLibrary.paused');
  return status;
}

export default async function QRLibrary({ searchParams }: { searchParams: Promise<{ q?: string; type?: string; status?: string }> }) {
  const params = await searchParams;
  const supabase = await createClient();
  const context = await getWorkspaceContext(supabase);
  const { t, formatInteger, formatDate } = await getServerI18n();
  if ('error' in context) return null;
  let query = supabase.from('qr_codes').select('id,name,slug,qr_type,destination_url,status,scan_count,style,created_at').eq('organization_id', context.organization.id).neq('status', 'archived').order('created_at', { ascending: false });
  if (params.q) query = query.ilike('name', `%${params.q.slice(0, 80)}%`);
  if (params.type && params.type !== 'all') query = query.eq('qr_type', params.type);
  if (params.status && params.status !== 'all') query = query.eq('status', params.status);
  const { data: codes, error } = await query;
  if (error) throw new Error(error.message);
  const scans = (codes ?? []).reduce((sum, code) => sum + (code.scan_count ?? 0), 0);

  return (
    <div className="shell">
      <DashboardSidebar
        active="library"
        userLabel={context.email}
        role={context.organization.role}
        workspaceName={context.organization.name}
        plan={context.organization.plan}
      />
      <main className="main">
        <div className="toprow">
          <div>
            <div className="eyebrow">{t('dashboard.qrLibrary.campaignControlCenter')}</div>
            <h1>{t('dashboard.qrLibrary.title') ?? t('dashboard.sidebar.library')}</h1>
            <p className="muted">{t('dashboard.qrLibrary.noCampaignsBody')}</p>
          </div>
          <Link className="btn" href="/dashboard/new">
            {t('dashboard.qrLibrary.newCampaign')}
          </Link>
        </div>
        <div className="stats compactstats">
          <article className="card stat">
            <span>{t('dashboard.qrLibrary.campaignCount')}</span>
            <b>{formatInteger(codes?.length ?? 0)}</b>
          </article>
          <article className="card stat">
            <span>{t('dashboard.qrLibrary.totalScans')}</span>
            <b>{formatInteger(scans)}</b>
          </article>
          <article className="card stat">
            <span>{t('dashboard.qrLibrary.active')}</span>
            <b>{formatInteger((codes ?? []).filter((code) => code.status === 'active').length)}</b>
          </article>
          <article className="card stat">
            <span>{t('dashboard.qrLibrary.paused')}</span>
            <b>{formatInteger((codes ?? []).filter((code) => code.status === 'paused').length)}</b>
          </article>
        </div>
        <form className="libraryfilters">
          <input className="input" name="q" defaultValue={params.q} placeholder={t('dashboard.qrLibrary.searchCampaigns')} />
          <select className="input" name="type" defaultValue={params.type ?? 'all'}>
            {goalTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {t(option.labelKey)}
              </option>
            ))}
          </select>
          <select className="input" name="status" defaultValue={params.status ?? 'all'}>
            <option value="all">{t('dashboard.qrLibrary.allStatuses')}</option>
            <option value="active">{t('dashboard.qrLibrary.active')}</option>
            <option value="paused">{t('dashboard.qrLibrary.paused')}</option>
          </select>
          <button className="btn secondary">{t('common.filter')}</button>
        </form>
        {!codes?.length ? (
          <section className="card empty">
            <div className="emptyicon">QR</div>
            <h2>{t('dashboard.qrLibrary.noCampaignsTitle')}</h2>
            <p className="muted">{t('dashboard.qrLibrary.noCampaignsBody')}</p>
            <Link className="btn" href="/dashboard/new">
              {t('dashboard.qrLibrary.createCampaign')}
            </Link>
          </section>
        ) : (
          <section className="librarygrid">
            {codes.map((code) => (
              <article className="card librarycard" key={code.id}>
                <div className="librarytop">
                  <div>
                    <span className="pill">{code.qr_type}</span>
                    <h3>{code.name}</h3>
                  </div>
                  <span className={`status ${code.status}`}>{getStatusLabel(t, code.status)}</span>
                </div>
                <p className="destination">{code.destination_url}</p>
                <div className="librarymetrics">
                  <span>
                    <b>{formatInteger(code.scan_count ?? 0)}</b> {t('dashboard.qrLibrary.scanCount')}
                  </span>
                  <span>
                    {t('common.created')} {formatDate(code.created_at)}
                  </span>
                </div>
                <QRLibraryActions {...code} canDelete={hasWorkspaceRole(context.organization.role, 'admin')} />
              </article>
            ))}
          </section>
        )}
      </main>
    </div>
  );
}
