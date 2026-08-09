import { NextResponse } from 'next/server';
import { z } from 'zod';
import { hasEntitlement } from '@/lib/plans';
import { createClient } from '@/lib/supabase/server';
import { getWorkspaceContext, hasWorkspaceRole } from '@/lib/workspace';

const schema = z.object({ decision: z.enum(['approved', 'rejected']) });
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const context = await getWorkspaceContext(supabase);
  if ('error' in context) return NextResponse.json({ error: context.error }, { status: 401 });
  if (!hasWorkspaceRole(context.organization.role, 'admin')) return NextResponse.json({ error: 'Admin approval is required.' }, { status: 403 });
  if (!hasEntitlement(context.organization.plan, 'ai.actions')) return NextResponse.json({ error: 'AI actions require Pro Plus AI.' }, { status: 403 });
  const parsed = schema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: 'Invalid review decision.' }, { status: 400 });
  const { data: action } = await supabase.from('ai_action_runs').select('id,status,action_type,action_payload').eq('id', id).eq('organization_id', context.organization.id).maybeSingle();
  if (!action) return NextResponse.json({ error: 'AI action not found.' }, { status: 404 });
  if (action.status !== 'proposed') return NextResponse.json({ error: 'This action has already been reviewed.' }, { status: 409 });
  if (parsed.data.decision === 'rejected') {
    await supabase.from('ai_action_runs').update({ status: 'rejected', reviewed_by: context.userId, reviewed_at: new Date().toISOString() }).eq('id', id);
    return NextResponse.json({ status: 'rejected' });
  }
  const campaignId = action.action_payload?.campaign_id;
  const status = action.action_type === 'pause_campaign' ? 'paused' : action.action_type === 'activate_campaign' ? 'active' : null;
  if (typeof campaignId !== 'string' || !status) return NextResponse.json({ error: 'This proposed action is not executable.' }, { status: 400 });
  const { data: campaign, error } = await supabase.from('qr_codes').update({ status }).eq('id', campaignId).eq('organization_id', context.organization.id).select('id,name').maybeSingle();
  if (error || !campaign) return NextResponse.json({ error: error?.message || 'Campaign not found.' }, { status: 400 });
  const now = new Date().toISOString();
  await Promise.all([
    supabase.from('ai_action_runs').update({ status: 'executed', reviewed_by: context.userId, reviewed_at: now, executed_at: now }).eq('id', id),
    supabase.from('audit_log').insert({ organization_id: context.organization.id, actor_user_id: context.userId, action: 'ai_action.executed', target_type: 'qr_code', target_id: campaign.id, details: { actionId: id, status } }),
  ]);
  return NextResponse.json({ status: 'executed', campaign: campaign.name });
}
