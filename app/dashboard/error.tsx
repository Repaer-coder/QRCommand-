'use client';

import { useI18n } from '@/components/i18n-provider';

export default function DashboardError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const { t } = useI18n();
  return (
    <main className="authpage">
      <section className="card authcard empty">
        <div className="emptyicon">!</div>
        <h1>{t('errors.dashboardErrorTitle')}</h1>
        <p className="muted">{t('errors.dashboardErrorMessage')}</p>
        <button className="btn" onClick={reset}>
          {t('errors.tryAgain')}
        </button>
      </section>
    </main>
  );
}
