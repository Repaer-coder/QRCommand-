import React from 'react';
import Link from 'next/link';
import { BarChart3, Building2, GitBranch, QrCode, ShieldCheck, Sparkles } from 'lucide-react';
import LegalLinks from '@/components/legal-links';
import { getServerI18n } from '@/lib/i18n/page';

const cells = Array.from({ length: 81 });

export default async function Home({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { t } = await getServerI18n();
  const { error } = await searchParams;
  const featureDefs = [
    [
      QrCode,
      t('qr.builder.dynamicCampaign'),
      t('home.operatingSystemDescription'),
    ],
    [
      BarChart3,
      t('navigation.platform'),
      t('pricing.description'),
    ],
    [
      Building2,
      t('dashboard.overview.commercialTitle'),
      t('dashboard.overview.campaignPulseSubtext'),
    ],
    [
      GitBranch,
      t('home.scanLayer.title'),
      t('home.scanLayer.value'),
    ],
    [
      ShieldCheck,
      t('dashboard.qrLibrary.permanentLink'),
      t('qr.library.permanentLink'),
    ],
    [
      Sparkles,
      t('dashboard.ai.header'),
      t('dashboard.ai.badge'),
    ],
  ] as const;

  const modules = [
    [t('home.systemCard.restaurant'), t('home.systemCard.restaurantDescription')],
    [t('home.systemCard.reputation'), t('home.systemCard.reputationDescription')],
    [t('home.systemCard.social'), t('home.systemCard.socialDescription')],
    [t('home.systemCard.operations'), t('home.systemCard.operationsDescription')],
  ] as const;

  return (
    <>
      <main className="container">
        {error && <p className="notice">{t('home.errorNotice')}</p>}
        <section className="hero">
          <div>
            <div className="eyebrow">{t('home.eyebrow')}</div>
            <h1>
              {t('home.heroTitle').split('\n')[0]} <span>{t('home.heroTitle').split('\n')[1]}</span>
            </h1>
            <p>{t('home.heroDescription')}</p>
            <div className="actions">
              <Link className="btn" href="/login?mode=signup">
                {t('home.cta.createWorkspace')}
              </Link>
              <Link className="btn secondary" href="/pricing">
                {t('home.cta.explorePlans')}
              </Link>
            </div>
          </div>
          <div className="card hero-visual">
            <div className="floating-metric one">
              <small>{t('home.destination.title')}</small>
              <b>{t('home.destination.value')}</b>
            </div>
            <div className="mockqr">{cells.map((_, index) => <i key={index} />)}</div>
            <div className="floating-metric two">
              <small>{t('home.scanLayer.title')}</small>
              <b>{t('home.scanLayer.value')}</b>
            </div>
          </div>
        </section>
        <section id="platform" className="section">
          <div className="section-lead">
            <div className="eyebrow">{t('navigation.platform')}</div>
            <h2>{t('home.operatingSystemTitle')}</h2>
            <p>{t('home.operatingSystemDescription')}</p>
          </div>
          <div className="grid3">
            {featureDefs.map(([Icon, title, description]) => (
              <article className="card feature" key={title}>
                <div className="feature-icon">
                  <Icon size={22} />
                </div>
                <h3>{title}</h3>
                <p>{description}</p>
              </article>
            ))}
          </div>
        </section>
        <section id="systems" className="section">
          <div className="section-lead">
            <div className="eyebrow">{t('navigation.systems')}</div>
            <h2>{t('home.systemCard.operations')}</h2>
          </div>
          <div className="landing-journey">
            {modules.map(([title, description]) => (
              <article className="card" key={title}>
                <h3>{title}</h3>
                <p className="muted">{description}</p>
              </article>
            ))}
          </div>
        </section>
        <section className="section">
          <div className="card cta-band">
            <h2>{t('home.grow')}</h2>
            <Link className="btn" href="/login?mode=signup">
              {t('home.cta.createWorkspace')}
            </Link>
          </div>
        </section>
      </main>
      <footer className="footer">
        <div className="container footer-links">
          <p>{t('metadata.description')}</p>
          <LegalLinks />
        </div>
      </footer>
    </>
  );
}
