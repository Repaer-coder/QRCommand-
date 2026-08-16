import Link from 'next/link';
import { getServerI18n } from '@/lib/i18n/page';

export default async function NotFound() {
  const { t } = await getServerI18n();

  return (
    <main className="authpage">
      <section className="card authcard empty">
        <div className="emptyicon">404</div>
        <h1>{t('errors.notFoundTitle')}</h1>
        <p className="muted">{t('errors.notFoundMessage')}</p>
        <Link className="btn" href="/dashboard">
          {t('errors.returnDashboard')}
        </Link>
      </section>
    </main>
  );
}
