import React from 'react';
import AuthForm from '@/components/auth-form';
import { getServerI18n } from '@/lib/i18n/page';
import { Metadata } from 'next';
import { Suspense } from 'react';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getServerI18n();
  return {
    title: `${t('auth.welcome')} | ${t('metadata.title')}`,
    description: t('auth.subtitle'),
  };
}

async function LoginLoadingFallback() {
  const { t } = await getServerI18n();
  return <div className="card authcard">{t('auth.loading')}</div>;
}

export default async function LoginPage() {
  return (
    <main className="authpage">
      <Suspense fallback={<LoginLoadingFallback />}>
        <AuthForm />
      </Suspense>
    </main>
  );
}
