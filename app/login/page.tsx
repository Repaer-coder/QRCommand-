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

export default async function LoginPage() {
  return (
    <main className="authpage">
      <Suspense fallback={<div className="card authcard">Loading secure sign in...</div>}>
        <AuthForm />
      </Suspense>
    </main>
  );
}
