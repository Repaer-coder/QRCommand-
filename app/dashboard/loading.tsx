'use client';

import { useI18n } from '@/components/i18n-provider';

export default function DashboardLoading() {
  const { t } = useI18n();

  return (
    <main className="main">
      <div className="eyebrow">{t('metadata.title')}</div>
      <h1>{t('common.loadingWorkspace')}</h1>
      <section className="stats">
        {Array.from({ length: 4 }, (_, index) => (
          <div className="card stat" key={index}>
            <span>{t('common.loading')}</span>
            <b>...</b>
          </div>
        ))}
      </section>
    </main>
  );
}
