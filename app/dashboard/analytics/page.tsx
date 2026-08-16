import DashboardSidebar from '@/components/dashboard-sidebar';
import { getServerI18n } from '@/lib/i18n/page';
import { getAnalyticsSnapshot } from '@/lib/analytics';
import { hasEntitlement } from '@/lib/plans';
import { createClient } from '@/lib/supabase/server';
import { getWorkspaceContext } from '@/lib/workspace';

export default async function Analytics({ searchParams }: { searchParams: Promise<{ days?: string }> }) {
  const params = await searchParams;
  const requestedDays = Number(params.days || 30);
  const supabase = await createClient();
  const context = await getWorkspaceContext(supabase);
  const { t, formatInteger, formatDate } = await getServerI18n();
  if ('error' in context) return null;

  const advanced = hasEntitlement(context.organization.plan, 'analytics.advanced');
  const periodDays = advanced && [14, 30, 90].includes(requestedDays) ? requestedDays : 30;
  const snapshot = await getAnalyticsSnapshot(supabase, context.organization.id, periodDays);
  const maxDaily = Math.max(...snapshot.daily.map((point) => point.scans), 1);

  function formatCampaignStatus(value: string) {
    if (value === 'active') return t('dashboard.qrLibrary.active');
    if (value === 'paused') return t('dashboard.qrLibrary.paused');
    if (value === 'completed') return t('dashboard.qrLibrary.paused');
    if (value === 'archived') return t('qr.actions.archive');
    return value;
  }

  return (
    <div className="shell">
      <DashboardSidebar
        active="analytics"
        userLabel={context.email}
        role={context.organization.role}
        workspaceName={context.organization.name}
        plan={context.organization.plan}
      />
      <main className="main">
        <div className="toprow">
          <div>
            <div className="eyebrow">{t('dashboard.analytics.eyebrow')}</div>
            <h1>{t('dashboard.analytics.heading')}</h1>
            <p className="muted">{t('dashboard.analytics.subtitle')}</p>
          </div>
          {advanced && (
            <form>
              <select className="input compact" name="days" defaultValue={periodDays}>
                <option value="14">{t('dashboard.analytics.days14')}</option>
                <option value="30">{t('dashboard.analytics.days30')}</option>
                <option value="90">{t('dashboard.analytics.days90')}</option>
              </select>
              <button className="mini">{t('dashboard.analytics.applyLabel')}</button>
            </form>
          )}
        </div>
        <div className="stats">
          <article className="card stat">
            <span>{t('dashboard.analytics.allScans')}</span>
            <b>{formatInteger(snapshot.totals.scans)}</b>
          </article>
          <article className="card stat">
            <span>{t('dashboard.analytics.periodScans')}</span>
            <b>{formatInteger(snapshot.totals.periodScans)}</b>
            <small>{formatInteger(snapshot.periodDays)} {t('dashboard.analytics.period')}</small>
          </article>
          <article className="card stat">
            <span>{t('dashboard.analytics.activeCampaigns')}</span>
            <b>{formatInteger(snapshot.totals.activeCampaigns)}</b>
          </article>
          <article className="card stat">
            <span>{t('dashboard.analytics.locations')}</span>
            <b>{formatInteger(snapshot.totals.locations)}</b>
          </article>
        </div>

        <section className="card chart-card">
          <div className="sectionhead">
            <div>
              <h2>{t('dashboard.analytics.chartTitle')}</h2>
              <p className="muted">{t('dashboard.analytics.chartDesc')}</p>
            </div>
            <span className="pill">{t('dashboard.analytics.live')}</span>
          </div>
          <div className="bar-chart" style={{ gridTemplateColumns: `repeat(${snapshot.daily.length}, minmax(4px, 1fr))` }}>
            {snapshot.daily.map((point) => (
              <div
                className="bar-column"
                key={point.date}
                title={`${formatDate(point.date)}: ${formatInteger(point.scans)} ${t('dashboard.analytics.scanMetric')}`}
              >
                <span style={{ height: `${Math.max((point.scans / maxDaily) * 100, 2)}%` }} />
                <small>{snapshot.periodDays <= 14 ? point.date.slice(5) : ''}</small>
              </div>
            ))}
          </div>
        </section>

        <div className="analytics-grid">
          <section className="card table-card">
            <div className="sectionhead">
              <h2>{t('dashboard.analytics.campaignPerformance')}</h2>
            </div>
            <div className="data-table">
              <div className="data-row data-head">
                <span>{t('dashboard.analytics.campaignLabel')}</span>
                <span>{t('dashboard.analytics.allScans')}</span>
                <span>{t('dashboard.analytics.period')}</span>
                <span>{t('dashboard.analytics.campaignLabelStatus')}</span>
              </div>
              {snapshot.campaigns.slice(0, 10).map((campaign) => (
                <div className="data-row" key={campaign.id}>
                  <b>{campaign.name}</b>
                  <span>{formatInteger(campaign.scans)}</span>
                  <span>{formatInteger(campaign.periodScans)}</span>
                  <span className={`status ${campaign.status}`}>{formatCampaignStatus(campaign.status)}</span>
                </div>
              ))}
            </div>
            {!snapshot.campaigns.length && <p className="muted">{t('dashboard.analytics.noCampaigns')}</p>}
          </section>

          <section className="card table-card">
            <div className="sectionhead">
              <h2>{t('dashboard.analytics.deviceMix')}</h2>
            </div>
            {snapshot.devices.length ? (
              <div className="metric-list">
                {snapshot.devices.map((device) => (
                  <div key={device.label}>
                    <span>{device.label}</span>
                    <b>{formatInteger(device.scans)}</b>
                  </div>
                ))}
              </div>
            ) : (
              <p className="muted">{t('dashboard.analytics.noDeviceData')}</p>
            )}
            {advanced && (
              <>
                <div className="sectionhead subhead">
                  <h3>{t('dashboard.analytics.locationTitle')}</h3>
                </div>
                <div className="metric-list">
                  {snapshot.locations.map((location) => (
                    <div key={location.id}>
                      <span>{location.name}</span>
                      <b>{formatInteger(location.scans)}</b>
                    </div>
                  ))}
                </div>
              </>
            )}
          </section>
        </div>

        {!advanced && (
          <section className="card upgrade-banner">
            <div>
              <div className="eyebrow">{t('dashboard.analytics.premium')}</div>
              <h2>{t('dashboard.analytics.upgrade')}</h2>
            </div>
            <a className="btn" href="/dashboard/billing">
              {t('dashboard.analytics.upgrade')}
            </a>
          </section>
        )}
      </main>
    </div>
  );
}
