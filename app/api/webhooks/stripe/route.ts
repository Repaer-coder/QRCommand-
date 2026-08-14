import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createAdminClient } from '@/lib/supabase/admin';
import { resolvePlanFromPrice, stripe } from '@/lib/stripe';

function periodEnd(subscription: Stripe.Subscription) {
  const timestamp = (subscription as Stripe.Subscription & { current_period_end?: number }).current_period_end;
  return timestamp ? new Date(timestamp * 1000).toISOString() : null;
}

async function syncSubscription(subscription: Stripe.Subscription, organizationHint?: string | null) {
  const supabase = createAdminClient();
  if (!supabase) throw new Error('Supabase admin client unavailable.');

  const customerId = typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id;
  const hintedOrganizationId = organizationHint || subscription.metadata.organizationId;
  let organizationId: string | null = null;
  if (hintedOrganizationId) {
    const { data: hintedWorkspace } = await supabase
      .from('organizations')
      .select('id,stripe_customer_id')
      .eq('id', hintedOrganizationId)
      .maybeSingle();
    if (hintedWorkspace?.stripe_customer_id === customerId) {
      organizationId = hintedWorkspace.id;
    }
  }
  if (!organizationId) {
    const { data: organization } = await supabase
      .from('organizations')
      .select('id')
      .eq('stripe_customer_id', customerId)
      .maybeSingle();
    organizationId = organization?.id;
  }
  if (!organizationId) throw new Error('No workspace is associated with this Stripe subscription.');

  const priceId = subscription.items.data[0]?.price.id ?? null;
  const entitled = subscription.status === 'active' || subscription.status === 'trialing';
  const plan = entitled ? resolvePlanFromPrice(priceId) : 'free';

  const subscriptionResult = await supabase.from('subscriptions').upsert(
    {
      organization_id: organizationId,
      stripe_subscription_id: subscription.id,
      status: subscription.status,
      price_id: priceId,
      current_period_end: periodEnd(subscription),
      cancel_at_period_end: subscription.cancel_at_period_end ?? false,
    },
    { onConflict: 'organization_id' }
  );
  if (subscriptionResult.error) throw new Error(subscriptionResult.error.message);

  const organizationResult = await supabase
    .from('organizations')
    .update({ plan, stripe_customer_id: customerId })
    .eq('id', organizationId);
  if (organizationResult.error) throw new Error(organizationResult.error.message);
}

export async function POST(request: Request) {
  if (!stripe || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Stripe webhook is not configured.' }, { status: 503 });
  }
  const signature = request.headers.get('stripe-signature');
  if (!signature) return NextResponse.json({ error: 'Missing Stripe signature.' }, { status: 400 });
  const supabase = createAdminClient();
  if (!supabase) return NextResponse.json({ error: 'Supabase admin client unavailable.' }, { status: 503 });

  let eventId: string | null = null;
  try {
    const body = await request.text();
    if (Buffer.byteLength(body, 'utf8') > 1024 * 1024) {
      return NextResponse.json({ error: 'Payload too large.' }, { status: 413 });
    }
    const event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET);
    eventId = event.id;

    const claim = await supabase
      .from('stripe_webhook_events')
      .insert({ event_id: event.id, event_type: event.type });
    if (claim.error?.code === '23505') return NextResponse.json({ received: true, duplicate: true });
    if (claim.error) throw new Error(claim.error.message);

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const subscriptionId = typeof session.subscription === 'string' ? session.subscription : session.subscription?.id;
      if (subscriptionId) {
        const subscription = await stripe.subscriptions.retrieve(subscriptionId, { expand: ['items.data.price'] });
        await syncSubscription(subscription, session.metadata?.organizationId ?? session.client_reference_id);
      }
    }

    if (
      event.type === 'customer.subscription.created' ||
      event.type === 'customer.subscription.updated' ||
      event.type === 'customer.subscription.deleted'
    ) {
      await syncSubscription(event.data.object as Stripe.Subscription);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    if (eventId) await supabase.from('stripe_webhook_events').delete().eq('event_id', eventId);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Webhook processing failed.' },
      { status: 400 }
    );
  }
}
