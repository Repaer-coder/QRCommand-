import { redirect } from 'next/navigation';
import React from 'react';
import OnboardingForm from '@/components/onboarding-form';
import { createClient } from '@/lib/supabase/server';
import { getWorkspaceContext } from '@/lib/workspace';
import { hasEntitlement, isPlatformOwnerEmail } from '@/lib/plans';
import { getServerI18n } from '@/lib/i18n/page';

export default async function OnboardingPage() {
  const { t, getRaw } = await getServerI18n();
  const supabase = await createClient();
  const context = await getWorkspaceContext(supabase);
  if ('error' in context) {
    if (!context.authenticated) redirect('/login?next=/onboarding');
    return (
      <main className="onboarding-page">
        <section className="card">
          <div className="eyebrow">{t('onboarding.validatingTitle')}</div>
          <h1>{t('onboarding.validatingTitle')}</h1>
          <p className="muted">{t('onboarding.validatingDescription')}</p>
          {context.stage ? <p className="muted">{t('onboarding.formTitle')}: {context.stage}</p> : null}
        </section>
      </main>
    );
  }
  if (context.organization.onboarding_completed_at) {
    if (!isPlatformOwnerEmail(context.email) && !hasEntitlement(context.organization.plan, 'qr.core')) {
      redirect('/dashboard/billing');
    }
    redirect('/dashboard');
  }
  if (context.organization.role !== 'owner') {
    return (
      <main className="onboarding-page">
        <section className="card">
          <div className="eyebrow">{t('onboarding.ownerTitle')}</div>
          <h1>{t('onboarding.ownerTitle')}</h1>
          <p className="muted">{t('onboarding.ownerDescription')}</p>
        </section>
      </main>
    );
  }

  return (
    <main className="onboarding-page">
      <section className="onboarding-copy">
        <div className="eyebrow">{t('onboarding.stepTitle')}</div>
        <h1>{t('onboarding.welcomeTitle')}</h1>
        <p>{t('onboarding.welcomeDescription')}</p>
        <div className="onboarding-points">
          {(Array.isArray(getRaw('onboarding.welcomeFeatures'))
            ? (getRaw('onboarding.welcomeFeatures') as string[])
            : []).map((feature: string) => <span key={feature}>{feature}</span>)}
        </div>
      </section>
      <OnboardingForm defaultName={context.organization.name} />
    </main>
  );
}
