import { redirect } from 'next/navigation';
import DashboardSidebar from '@/components/dashboard-sidebar';
import { CheckoutButton, PortalButton } from '@/components/billing-actions';
import { plans, type PaidPlanName } from '@/lib/plans';
import { prices, resolvePlanFromPrice } from '@/lib/stripe';
import { createClient } from '@/lib/supabase/server';
import { canManageBilling, getPlanLabel, getWorkspaceContext } from '@/lib/workspace';

const paidPlans: PaidPlanName[] = ['essentials', 'premium', 'pro', 'pro_plus_ai'];
const features: Record<PaidPlanName, string[]> = {
  essentials: ['Dynamic QR campaigns', 'One location', 'Basic scan analytics'],
  premium: ['Growth blueprints', 'Advanced analytics', 'Teams and multi-location'],
  pro: ['Automation engine', 'Webhook integrations', 'Audit-ready operations'],
  pro_plus_ai: ['AI insights and reporting', 'Campaign and playbook drafts', 'Approval-gated AI actions'],
};

export default async function BillingPage({ searchParams }: { searchParams: Promise<{ checkout?: string }> }) {
  const params = await searchParams;
  const supabase = await createClient();
  const context = await getWorkspaceContext(supabase);
  if ('error' in context) return null;
  if (!canManageBilling(context.organization.role)) redirect('/dashboard');
  const { data: subscription } = await supabase.from('subscriptions').select('status,price_id,current_period_end,cancel_at_period_end').eq('organization_id', context.organization.id).maybeSingle();
  const effectivePlan = subscription?.price_id && ['active', 'trialing'].includes(subscription.status) ? resolvePlanFromPrice(subscription.price_id) : context.organization.plan;

  return <div className="shell"><DashboardSidebar active="billing" userLabel={context.email} role={context.organization.role} workspaceName={context.organization.name} plan={context.organization.plan} /><main className="main"><div className="toprow"><div><div className="eyebrow">Commercial control</div><h1>Billing and entitlements</h1><p className="muted">Stripe webhooks are the authority for paid access and downgrade states.</p></div><div className="plan-chip"><span>{getPlanLabel(effectivePlan)}</span><small>{subscription?.status ?? 'no paid subscription'}</small></div></div>{params.checkout === 'success' && <p className="notice success">Checkout completed. Stripe is confirming your subscription; this page updates after the webhook arrives.</p>}{params.checkout === 'cancelled' && <p className="notice">Checkout was cancelled. No plan changes were made.</p>}<section className="card billing-status"><div><h2>Current subscription</h2><p className="muted">{subscription ? `Status: ${subscription.status}` : 'No paid Stripe subscription is stored for this workspace.'}</p>{subscription?.current_period_end && <p>Current period ends <b>{new Date(subscription.current_period_end).toLocaleDateString()}</b>{subscription.cancel_at_period_end ? ' and will not renew.' : '.'}</p>}</div>{context.organization.stripe_customer_id && <PortalButton />}</section><section className="pricing tier-pricing">{paidPlans.map((plan) => <article className={`card price ${plan === 'premium' ? 'popular' : ''}`} key={plan}>{plan === 'premium' && <span className="badge">GROWTH FAVORITE</span>}<div className="eyebrow">{plans[plan].label}</div><h2>{plans[plan].displayPrice}<small>{plans[plan].displayPrice.startsWith('$') ? '/month' : ''}</small></h2><p className="muted">{plans[plan].description}</p><div className="list">{features[plan].map((feature) => <span key={feature}>{feature}</span>)}</div>{prices[plan] ? <CheckoutButton plan={plan} disabled={effectivePlan === plan} /> : <button className="btn secondary" disabled>Configure Stripe price</button>}</article>)}</section><p className="muted billing-note">Displayed legacy prices reflect the existing project configuration. Stripe Checkout is the final source for charged price, tax, promotions, and billing terms.</p></main></div>;
}
