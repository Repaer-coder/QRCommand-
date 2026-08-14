import Link from 'next/link';
import LegalLinks from '@/components/legal-links';
import { plans, type PaidPlanName } from '@/lib/plans';
import React from 'react';

const paidPlans: PaidPlanName[] = ['essentials', 'premium', 'pro', 'pro_plus_ai'];
const features: Record<PaidPlanName, string[]> = {
  essentials: ['Permanent dynamic campaigns', 'Basic scan analytics', 'One business location'],
  premium: ['Growth blueprints', 'Advanced analytics', 'Teams and multi-location', 'Restaurant, reputation, and social hubs'],
  pro: ['Automation rules and run history', 'Encrypted signed webhooks', 'Advanced workflows and auditability'],
  pro_plus_ai: ['Organization-aware AI insights', 'Campaign and playbook drafts', 'Executive reporting', 'Approval-gated AI actions'],
};

export default function Pricing() {
  return (
    <main className="container section">
      <div className="section-lead">
        <div className="eyebrow">Four commercial tiers</div>
        <h1>Start with infrastructure. Add growth, operations, and intelligence.</h1>
        <p>Plan access is synchronized from Stripe subscription state. Final charged pricing and billing terms are always shown in secure Stripe Checkout.</p>
      </div>
      <section className="pricing">{paidPlans.map((plan) =>
        <article className={`card price ${plan === 'premium' ? 'popular' : ''}`} key={plan}>
          {plan === 'premium' && <span className="badge">GROWTH FAVORITE</span>}
          <div className="eyebrow">{plans[plan].label}</div>
          <h2>
            {plans[plan].displayPrice}
            <small>{plans[plan].displayPrice.startsWith('$') ? '/month' : ''}</small>
          </h2>
          <p className="muted">{plans[plan].description}</p>
          <div className="list">{features[plan].map((feature) => <span key={feature}>{feature}</span>)}</div>
          <Link href="/login?mode=signup&next=/dashboard/billing" className="btn">Start workspace</Link>
        </article>
      )}</section>
      <p className="muted billing-note">
        Subscriptions renew monthly until canceled. All payments are non-refundable except where required by applicable law. Cancel through the Stripe customer portal in
        {' '}<Link href="/dashboard/billing">Dashboard Billing</Link>. See our <Link href="/refund-policy">Subscription Cancellation and Refund Policy</Link>.
      </p>
      <LegalLinks />
    </main>
  );
}
