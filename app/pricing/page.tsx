import Link from 'next/link';
import LegalLinks from '@/components/legal-links';
import { plans, type PaidPlanName } from '@/lib/plans';
import { getServerI18n } from '@/lib/i18n/page';
import React from 'react';
import { Metadata } from 'next';

const paidPlans: PaidPlanName[] = ['essentials', 'premium', 'pro', 'pro_plus_ai'];

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getServerI18n();
  return {
    title: t('pricing.title'),
    description: t('pricing.description'),
  };
}

export default async function Pricing() {
  const { t } = await getServerI18n();
  const features: Record<PaidPlanName, string[]> = {
    essentials: [
      t('qr.builder.dynamicCampaign'),
      t('dashboard.qrLibrary.newCampaign'),
      t('dashboard.analytics.chartTitle'),
    ],
    premium: [
      t('home.systemCard.restaurant'),
      t('home.systemCard.reputation'),
      t('home.systemCard.social'),
      t('blueprints.title'),
    ],
    pro: [
      t('dashboard.automation.title'),
      t('dashboard.automation.sectionTitle'),
      t('dashboard.automation.fieldAction'),
      t('dashboard.integrations.safeTitle'),
    ],
    pro_plus_ai: [
      t('dashboard.ai.header'),
      t('dashboard.ai.draftTitle'),
      t('dashboard.ai.reportTitle'),
      t('dashboard.ai.approve'),
    ],
  };

  return (
    <main className="container section">
      <div className="section-lead">
        <div className="eyebrow">{t('pricing.eyebrow')}</div>
        <h1>{t('pricing.title')}</h1>
        <p>{t('pricing.description')}</p>
      </div>
      <section className="pricing">
        {paidPlans.map((plan) => (
          <article className={`card price ${plan === 'premium' ? 'popular' : ''}`} key={plan}>
            {plan === 'premium' && <span className="badge">{t('pricing.planLabel')}</span>}
            <div className="eyebrow">{t(`plans.${plan}.label`)}</div>
            <h2>
              {plans[plan].displayPrice}
              <small>{plans[plan].displayPrice.startsWith('$') ? '/month' : ''}</small>
            </h2>
            <p className="muted">{t(`plans.${plan}.description`)}</p>
            <div className="list">
              {features[plan].map((feature) => (
                <span key={`${plan}-${feature}`}>{feature}</span>
              ))}
            </div>
            <Link href="/login?mode=signup&next=/dashboard/billing" className="btn">
              {t('navigation.startBuilding')}
            </Link>
          </article>
        ))}
      </section>
      <p className="muted billing-note">
        {t('pricing.billingNotice')}
      </p>
      <LegalLinks />
    </main>
  );
}
