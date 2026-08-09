import { NextResponse } from 'next/server';
import { z } from 'zod';
import { generateCampaignDraft } from '@/lib/ai';
import { getAnalyticsSnapshot } from '@/lib/analytics';
import { hasEntitlement } from '@/lib/plans';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { getWorkspaceContext } from '@/lib/workspace';

const schema = z.object({ goal: z.string().trim().min(10).max(500) });
export async function POST(request: Request) {
  const supabase = await createClient();
  const context = await getWorkspaceContext(supabase);
  if ('error' in context) return NextResponse.json({ error: context.error }, { status: 401 });
  if (!hasEntitlement(context.organization.plan, 'ai.builder')) return NextResponse.json({ error: 'AI campaign drafting requires Pro Plus AI.' }, { status: 403 });
  const parsed = schema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: 'Describe the business goal in at least 10 characters.' }, { status: 400 });
  const admin = createAdminClient();
  if (!admin || !process.env.OPENAI_API_KEY) return NextResponse.json({ error: 'AI provider and server audit credentials must be configured.' }, { status: 503 });
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count } = await admin.from('ai_usage').select('id', { count: 'exact', head: true }).eq('organization_id', context.organization.id).gte('created_at', oneHourAgo).in('status', ['started', 'succeeded']);
  if ((count ?? 0) >= 10) return NextResponse.json({ error: 'AI hourly request limit reached. Try again later.' }, { status: 429 });
  const { data: usage } = await admin.from('ai_usage').insert({ organization_id: context.organization.id, user_id: context.userId, operation: 'campaign_draft' }).select('id').single();
  if (!usage) return NextResponse.json({ error: 'Could not create AI audit record.' }, { status: 500 });
  try {
    const snapshot = await getAnalyticsSnapshot(supabase, context.organization.id, 30);
    const result = await generateCampaignDraft(parsed.data.goal, snapshot, { name: context.organization.name, businessType: context.organization.business_type });
    await admin.from('ai_recommendations').insert({ organization_id: context.organization.id, title: `Campaign draft: ${result.data.name}`, rationale: result.data.rationale, confidence: 'medium', supporting_metrics: [{ goal: parsed.data.goal, draft: result.data }], status: 'draft', created_by: context.userId });
    await admin.from('ai_usage').update({ status: 'succeeded', model: result.model, input_tokens: result.usage.input_tokens ?? null, output_tokens: result.usage.output_tokens ?? null, request_id: result.requestId, completed_at: new Date().toISOString() }).eq('id', usage.id);
    return NextResponse.json(result.data);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'AI campaign drafting failed.';
    await admin.from('ai_usage').update({ status: 'failed', error: message, completed_at: new Date().toISOString() }).eq('id', usage.id);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
