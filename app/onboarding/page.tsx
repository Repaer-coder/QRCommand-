import { redirect } from 'next/navigation';
import React from 'react';
import OnboardingForm from '@/components/onboarding-form';
import { createClient } from '@/lib/supabase/server';
import { getWorkspaceContext } from '@/lib/workspace';
import { hasEntitlement, isPlatformOwnerEmail } from '@/lib/plans';

export default async function OnboardingPage() {
  const supabase = await createClient();
  const context = await getWorkspaceContext(supabase);
  if ('error' in context) {
    if (!context.authenticated) redirect('/login?next=/onboarding');
    return (
      <main className="onboarding-page">
        <section className="card">
          <div className="eyebrow">Workspace setup</div>
          <h1>We are validating your workspace.</h1>
          <p className="muted">
            The account is authenticated, but workspace initialization is still in progress. Please retry
            onboarding.
          </p>
          {context.stage ? <p className="muted">Initialization stage: {context.stage}</p> : null}
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
    return <main className="onboarding-page"><section className="card"><div className="eyebrow">Workspace setup</div><h1>The workspace owner needs to finish setup.</h1><p className="muted">Once onboarding is complete, refresh this page to enter the dashboard.</p></section></main>;
  }
  return <main className="onboarding-page"><section className="onboarding-copy"><div className="eyebrow">Welcome to QR Command</div><h1>Build the operating layer behind every scan.</h1><p>Start with your business identity and first location. You can create a dynamic campaign in the next step.</p><div className="onboarding-points"><span>Permanent, editable QR destinations</span><span>Real scan and location analytics</span><span>Growth systems that scale with your plan</span></div></section><OnboardingForm defaultName={context.organization.name} /></main>;
}
