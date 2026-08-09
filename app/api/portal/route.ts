import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getWorkspaceContext } from '@/lib/workspace';
import { canManageBilling } from '@/lib/workspace';
import { getAppUrl, stripe } from '@/lib/stripe';

export async function POST(req: Request) {
  if (!stripe) return NextResponse.json({ error: 'Stripe is not configured.' }, { status: 503 });

  const supabase = await createClient();
  const context = await getWorkspaceContext(supabase);
  if ('error' in context) return NextResponse.json({ error: context.error }, { status: 401 });
  if (!canManageBilling(context.organization.role)) {
    return NextResponse.json({ error: 'Only workspace owners and admins can manage billing.' }, { status: 403 });
  }

  if (!context.organization.stripe_customer_id) {
    return NextResponse.json({ error: 'No active billing profile found for this workspace.' }, { status: 400 });
  }

  const returnUrl = getAppUrl(req);
  const session = await stripe.billingPortal.sessions.create({
    customer: context.organization.stripe_customer_id,
    return_url: `${returnUrl}/dashboard/billing`,
  });

  return NextResponse.json({ url: session.url ?? '' });
}
