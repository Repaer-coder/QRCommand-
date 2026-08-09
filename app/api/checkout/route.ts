import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { canManageBilling, getWorkspaceContext } from '@/lib/workspace';
import { getAppUrl, resolvePrice, stripe } from '@/lib/stripe';

const schema = z.object({ plan: z.enum(['essentials', 'premium', 'pro', 'pro_plus_ai']) });

export async function POST(request: Request) {
  if (!stripe) return NextResponse.json({ error: 'Stripe is not configured.' }, { status: 503 });

  const supabase = await createClient();
  const context = await getWorkspaceContext(supabase);
  if ('error' in context) return NextResponse.json({ error: context.error }, { status: 401 });
  if (!canManageBilling(context.organization.role)) {
    return NextResponse.json({ error: 'Only workspace owners and admins can change billing.' }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const payload = schema.safeParse(body);
  if (!payload.success) return NextResponse.json({ error: 'Invalid checkout payload.' }, { status: 400 });

  const price = resolvePrice(payload.data.plan);
  if (!price) {
    return NextResponse.json(
      { error: `The ${payload.data.plan.replaceAll('_', ' ')} Stripe price is not configured.` },
      { status: 503 }
    );
  }

  const { data: existingSubscription } = await supabase
    .from('subscriptions')
    .select('status')
    .eq('organization_id', context.organization.id)
    .in('status', ['active', 'trialing', 'past_due'])
    .maybeSingle();
  if (existingSubscription) {
    return NextResponse.json(
      { error: 'Use the billing portal to change an existing subscription.' },
      { status: 409 }
    );
  }

  let customerId = context.organization.stripe_customer_id;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: context.email,
      name: context.organization.name,
      metadata: { userId: context.userId, organizationId: context.organization.id },
    });
    customerId = customer.id;
    const update = await supabase
      .from('organizations')
      .update({ stripe_customer_id: customerId })
      .eq('id', context.organization.id);
    if (update.error) return NextResponse.json({ error: update.error.message }, { status: 400 });
  }

  const appUrl = getAppUrl(request);
  const metadata = {
    organizationId: context.organization.id,
    userId: context.userId,
    plan: payload.data.plan,
  };
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    client_reference_id: context.organization.id,
    metadata,
    subscription_data: { metadata },
    line_items: [{ price, quantity: 1 }],
    mode: 'subscription',
    success_url: `${appUrl}/dashboard/billing?checkout=success`,
    cancel_url: `${appUrl}/dashboard/billing?checkout=cancelled`,
    allow_promotion_codes: true,
  });

  if (!session.url) return NextResponse.json({ error: 'Stripe did not return a checkout URL.' }, { status: 502 });
  return NextResponse.json({ url: session.url });
}
