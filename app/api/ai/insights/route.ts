import { NextResponse } from 'next/server';
import { generateInsights } from '@/lib/ai';
import { getAnalyticsSnapshot } from '@/lib/analytics';
import { hasEntitlement } from '@/lib/plans';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { getWorkspaceContext, hasWorkspaceRole } from '@/lib/workspace';

export async function POST() {
  const supabase = await createClient();
  const context = await getWorkspaceContext(supabase);
  if ('error' in context) return NextResponse.json({ error: context.error }, { status: 401 });
  if (!hasWorkspaceRole(context.organization.role, 'manager')) return NextResponse.json({ error: 'Manager access is required.' }, { status: 403 });
  if (!hasEntitlement(context.organization.plan, 'ai.insights')) return NextResponse.json({ error: 'AI insights require Pro Plus AI.' }, { status: 403 });
  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY is required for AI audit records.' }, { status: 503 });
  if (!process.env.OPENAI_API_KEY) return NextResponse.json({ error: 'OPENAI_API_KEY is not configured.' }, { status: 503 });

  const hourAgo = new Date(Date.now() - 3600000).toISOString();
  const { count } = await admin.from('ai_usage').select('id', { count: 'exact', head: true }).eq('organization_id', context.organization.id).gte('created_at', hourAgo).eq('status', 'succeeded');
  if ((count ?? 0) >= 10) return NextResponse.json({ error: 'Hourly AI insight limit reached. Try again later.' }, { status: 429 });
  const { data: usage, error: usageError } = await admin.from('ai_usage').insert({ organization_id: context.organization.id, user_id: context.userId, operation: 'insights' }).select('id').single();
  if (usageError || !usage) return NextResponse.json({ error: usageError?.message || 'Could not create AI audit record.' }, { status: 500 });

  try {
    const snapshot = await getAnalyticsSnapshot(supabase, context.organization.id, 30);
    const result = await generateInsights(snapshot, { name: context.organization.name, businessType: context.organization.business_type });
    const periodStart = new Date(Date.now() - 29 * 86400000).toISOString();
    const periodEnd = new Date().toISOString();
    for (const insight of result.data.insights) {
      const insert = await admin.from('ai_insights').insert({ organization_id: context.organization.id, title: insight.title, summary: insight.summary, severity: insight.severity, evidence: insight.evidence, period_start: periodStart, period_end: periodEnd, created_by: context.userId });
      if (insert.error) throw new Error(insert.error.message);
    }
    const campaignIds = new Set(snapshot.campaigns.map((campaign) => campaign.id));
    for (const recommendation of result.data.recommendations) {
      const { data: stored, error } = await admin.from('ai_recommendations').insert({ organization_id: context.organization.id, title: recommendation.title, rationale: recommendation.rationale, confidence: recommendation.confidence, supporting_metrics: recommendation.supporting_metrics, created_by: context.userId }).select('id').single();
      if (error || !stored) throw new Error(error?.message || 'Could not store AI recommendation.');
      const action = recommendation.proposed_action;
      if (action.type !== 'none' && action.campaign_id && campaignIds.has(action.campaign_id)) {
        await admin.from('ai_action_runs').insert({ organization_id: context.organization.id, recommendation_id: stored.id, action_type: action.type, action_payload: { campaign_id: action.campaign_id }, proposed_by: context.userId });
      }
    }
    await admin.from('ai_usage').update({ status: 'succeeded', model: result.model, input_tokens: result.usage.input_tokens ?? null, output_tokens: result.usage.output_tokens ?? null, request_id: result.requestId, completed_at: new Date().toISOString() }).eq('id', usage.id);
    return NextResponse.json(result.data);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'AI insight generation failed.';
    await admin.from('ai_usage').update({ status: 'failed', error: message, completed_at: new Date().toISOString() }).eq('id', usage.id);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
