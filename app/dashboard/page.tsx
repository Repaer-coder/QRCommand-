import Link from 'next/link';
import DashboardSidebar from '@/components/dashboard-sidebar';
import GrowthBlueprints from '@/components/growth-blueprints';
import { getAnalyticsSnapshot } from '@/lib/analytics';
import { hasEntitlement } from '@/lib/plans';
import { createClient } from '@/lib/supabase/server';
import { getPlanLabel, getWorkspaceContext } from '@/lib/workspace';
import { getServerI18n } from '@/lib/i18n/page';

function resolveStatusLabel(t: (key: string) => string, status: string) {
  switch (status) {
    case 'active':
      return t('dashboard.qrLibrary.active');
    case 'paused':
      return t('dashboard.qrLibrary.paused');
    case 'completed':
      return t('qr.actions.archive');
    case 'archived':
      return t('qr.actions.archive');
    default:
      return status;
  }
}

export default async function Dashboard() {
  const { t, formatInteger } = await getServerI18n();
  const supabase = await createClient();
  const context = await getWorkspaceContext(supabase);
  if ('error' in context) return null;

  const snapshot = await getAnalyticsSnapshot(supabase, context.organization.id, 14).catch((error) => { console.error('Dashboard analytics failed:', error); return { generatedAt: new Date().toISOString(), periodDays: 14, totals: { campaigns: 0, activeCampaigns: 0, scans: 0, periodScans: 0, locations: 0 }, daily: [], campaigns: [], devices: [], locations: [] }; });
  const recent = snapshot.campaigns.slice(0, 6);

  return (
    <div className="shell">
      <DashboardSidebar
        active="overview"
        userLabel={context.email}
        role={context.organization.role}
        workspaceName={context.organization.name}
        plan={context.organization.plan}
      />
      <main className="main">
        <div className="toprow">
          <div>
            <div className="eyebrow">{t('dashboard.overview.commercialTitle')}</div>
            <h1>{t('dashboard.overview.pageTitle')}</h1>
            <p className="muted">{t('dashboard.overview.purpose')}</p>
          </div>
          <div className="plan-chip">
            <span>{getPlanLabel(context.organization.plan)}</span>
            <small>{context.organization.role}</small>
          </div>
        </div>
        <div className="stats">
          <article className="card stat">
            <span>{t('dashboard.qrLibrary.totalScans')}</span>
            <b>{formatInteger(snapshot.totals.scans)}</b>
            <small>{t('dashboard.overview.periodScans').replace('{days}', String(snapshot.periodDays))}</small>
          </article>
          <article className="card stat">
            <span>{t('dashboard.overview.activeCampaigns')}</span>
            <b>{formatInteger(snapshot.totals.activeCampaigns)}</b>
            <small>{formatInteger(snapshot.totals.campaigns)} {t('dashboard.overview.campaignCount')}</small>
          </article>
          <article className="card stat">
            <span>{t('dashboard.overview.locationTitle')}</span>
            <b>{formatInteger(snapshot.totals.locations)}</b>
            <small>{t('dashboard.overview.locationLabel')}</small>
          </article>
          <article className="card stat">
            <span>{t('dashboard.billing.currentSubscription')}</span>
            <b>{getPlanLabel(context.organization.plan)}</b>
            <small>{t('dashboard.billing.notEntitled')}</small>
          </article>
        </div>

        <section className="dashboard-grid">
          <article className="card action-card">
            <div className="eyebrow">{t('dashboard.overview.nextBest')}</div>
            <h2>{snapshot.totals.campaigns ? t('dashboard.overview.keepStrong') : t('dashboard.overview.noCampaigns')}</h2>
            <p className="muted">{t('dashboard.overview.destination')}</p>
            <div className="actions">
              <Link className="btn" href="/dashboard/new">
                {t('dashboard.qrLibrary.newCampaign')}
              </Link>
              <Link className="btn secondary" href="/dashboard/qr-codes">
                {t('dashboard.qrLibrary.openLibrary')}
              </Link>
            </div>
          </article>
          <article className="card trend-card">
            <div className="sectionhead">
              <h3>{t('dashboard.overview.scanPulseTitle')}</h3>
              <Link className="textlink" href="/dashboard/analytics">
                {t('dashboard.overview.openAnalytics')}
              </Link>
            </div>
            <div className="sparkbars">
              {snapshot.daily.map((point) => {
                const max = Math.max(...snapshot.daily.map((item) => item.scans), 1);
                return <span key={point.date} title={`${point.date}: ${formatInteger(point.scans)} ${t('dashboard.qrLibrary.scanCount')}`} style={{ height: `${Math.max((point.scans / max) * 100, 5)}%` }} />;
              })}
            </div>
          </article>
        </section>

        <section className="card table-card">
          <div className="table-toolbar">
            <div>
              <h2>{t('dashboard.overview.campaignPulse')}</h2>
              <p className="muted">{t('dashboard.overview.campaignPulseSubtext')}</p>
            </div>
            <Link className="textlink" href="/dashboard/qr-codes">
              {t('dashboard.qrLibrary.openLibrary')}
            </Link>
          </div>
          {recent.length ? (
            <div className="data-table campaign-table">
              <div className="data-row data-head">
                <span>{t('dashboard.qrLibrary.campaign')}</span>
                <span>{t('dashboard.qrLibrary.status')}</span>
                <span>{t('dashboard.analytics.allScans')}</span>
                <span>{t('dashboard.analytics.period')}</span>
              </div>
              {recent.map((code) => (
                <div className="data-row" key={code.id}>
                  <Link href={`/dashboard/qr-codes/${code.id}`}><b>{code.name}</b></Link>
                  <span className={`status ${code.status}`}>{resolveStatusLabel(t, code.status)}</span>
                  <span>{formatInteger(code.scans)}</span>
                  <span>{formatInteger(code.periodScans)}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-inline">
              <p>{t('dashboard.overview.noScanYet')}</p>
              <Link className="btn" href="/dashboard/new">
                {t('dashboard.overview.createCampaignButton')}
              </Link>
            </div>
          )}
        </section>

        {hasEntitlement(context.organization.plan, 'blueprints.growth') ? <GrowthBlueprints /> : <section className="card upgrade-banner">
          <div>
            <div className="eyebrow">{t('dashboard.overview.notEntitledTitle')}</div>
            <h2>{t('dashboard.overview.notEntitledHeadline')}</h2>
            <p className="muted">{t('dashboard.overview.notEntitledDescription')}</p>
          </div>
          <Link className="btn" href="/dashboard/billing">
            {t('dashboard.overview.upgrade')}
          </Link>
        </section>}
      </main>
    </div>
  );
}
