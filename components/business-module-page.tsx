import Link from 'next/link';
import DashboardSidebar from '@/components/dashboard-sidebar';
import { getServerI18n } from '@/lib/i18n/page';
import { hasEntitlement } from '@/lib/plans';
import { createClient } from '@/lib/supabase/server';
import { getWorkspaceContext } from '@/lib/workspace';
import { redirect } from 'next/navigation';

type ModuleType = 'restaurant' | 'reviews' | 'social';

type ModuleCampaign = { id: string; name: string; destination_url: string; status: string; scan_count: number | null };

type ModuleContent = {
  eyebrowKey: string;
  titleKey: string;
  descriptionKey: string;
  createLabelKey: string;
  liveTitleKey: string;
  liveDescriptionKey: string;
  emptyLabelKey: string;
  stageKeys: string[];
};

const moduleCopy: Record<ModuleType, ModuleContent> = {
  restaurant: {
    eyebrowKey: 'dashboard.modules.restaurant.eyebrow',
    titleKey: 'dashboard.modules.restaurant.title',
    descriptionKey: 'dashboard.modules.restaurant.description',
    createLabelKey: 'dashboard.modules.restaurant.createCampaign',
    liveTitleKey: 'dashboard.modules.restaurant.liveCampaignsTitle',
    liveDescriptionKey: 'dashboard.modules.restaurant.liveCampaignsDescription',
    emptyLabelKey: 'dashboard.modules.restaurant.emptyLabel',
    stageKeys: [
      'dashboard.modules.restaurant.stages.menuDiscovery',
      'dashboard.modules.restaurant.stages.orderDestination',
      'dashboard.modules.restaurant.stages.reviewPrompt',
      'dashboard.modules.restaurant.stages.returnVisit',
    ],
  },
  reviews: {
    eyebrowKey: 'dashboard.modules.reviews.eyebrow',
    titleKey: 'dashboard.modules.reviews.title',
    descriptionKey: 'dashboard.modules.reviews.description',
    createLabelKey: 'dashboard.modules.reviews.createCampaign',
    liveTitleKey: 'dashboard.modules.reviews.liveCampaignsTitle',
    liveDescriptionKey: 'dashboard.modules.reviews.liveCampaignsDescription',
    emptyLabelKey: 'dashboard.modules.reviews.emptyLabel',
    stageKeys: [
      'dashboard.modules.reviews.stages.customerMoment',
      'dashboard.modules.reviews.stages.reviewDestination',
      'dashboard.modules.reviews.stages.privateFeedback',
      'dashboard.modules.reviews.stages.referralFollowup',
    ],
  },
  social: {
    eyebrowKey: 'dashboard.modules.social.eyebrow',
    titleKey: 'dashboard.modules.social.title',
    descriptionKey: 'dashboard.modules.social.description',
    createLabelKey: 'dashboard.modules.social.createCampaign',
    liveTitleKey: 'dashboard.modules.social.liveCampaignsTitle',
    liveDescriptionKey: 'dashboard.modules.social.liveCampaignsDescription',
    emptyLabelKey: 'dashboard.modules.social.emptyLabel',
    stageKeys: [
      'dashboard.modules.social.stages.placement',
      'dashboard.modules.social.stages.socialDestination',
      'dashboard.modules.social.stages.offerOrContent',
      'dashboard.modules.social.stages.measuredEngagement',
    ],
  },
};

export default async function BusinessModulePage({ type }: { type: ModuleType }) {
  const tData = await getServerI18n();
  const t = tData.t;

  const supabase = await createClient();
  const context = await getWorkspaceContext(supabase);
  if ('error' in context) return null;
  if (!hasEntitlement(context.organization.plan, 'restaurant.hub')) redirect('/dashboard/billing');

  const copy = moduleCopy[type];
  const { data: campaigns } = await supabase
    .from('qr_codes')
    .select('id,name,status,scan_count,destination_url')
    .eq('organization_id', context.organization.id)
    .eq('qr_type', type)
    .neq('status', 'archived')
    .order('scan_count', { ascending: false });

  const normalizedCampaigns = (campaigns ?? []) as ModuleCampaign[];

  return (
    <div className="shell">
      <DashboardSidebar
        active={type}
        userLabel={context.email}
        role={context.organization.role}
        workspaceName={context.organization.name}
        plan={context.organization.plan}
      />
      <main className="main">
        <div className="toprow">
          <div>
            <div className="eyebrow">{t(copy.eyebrowKey)}</div>
            <h1>{t(copy.titleKey)}</h1>
            <p className="muted">{t(copy.descriptionKey)}</p>
          </div>
          <Link className="btn" href={`/dashboard/new?type=${type}`}>
            {t(copy.createLabelKey)}
          </Link>
        </div>

        <section className="journey">
          {copy.stageKeys.map((stageKey, index) => (
            <article className="card journey-step" key={stageKey}>
              <span>0{index + 1}</span>
              <h2>{t(stageKey)}</h2>
            </article>
          ))}
        </section>

        <section className="card table-card">
          <div className="sectionhead">
            <div>
              <h2>{t(copy.liveTitleKey)}</h2>
              <p className="muted">{t(copy.liveDescriptionKey)}</p>
            </div>
          </div>
          {normalizedCampaigns.length ? (
            <div className="data-table">
              <div className="data-row data-head">
                <span>{t('dashboard.modules.tableHeaders.campaign')}</span>
                <span>{t('dashboard.modules.tableHeaders.destination')}</span>
                <span>{t('dashboard.modules.tableHeaders.scans')}</span>
                <span>{t('dashboard.modules.tableHeaders.status')}</span>
              </div>
              {normalizedCampaigns.map((campaign) => (
                <div className="data-row" key={campaign.id}>
                  <Link href={`/dashboard/qr-codes/${campaign.id}`}>
                    <b>{campaign.name}</b>
                  </Link>
                  <span className="truncate">{campaign.destination_url}</span>
                  <span>{campaign.scan_count ?? 0}</span>
                  <span className={`status ${campaign.status}`}>{campaign.status}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-inline">
              <p>{t(copy.emptyLabelKey)}</p>
              <Link className="btn" href={`/dashboard/new?type=${type}`}>
                {t(copy.createLabelKey)}
              </Link>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
