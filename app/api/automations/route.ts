import { NextResponse } from 'next/server';
import { z } from 'zod';
import { hasEntitlement } from '@/lib/plans';
import { createClient } from '@/lib/supabase/server';
import { getWorkspaceContext, hasWorkspaceRole } from '@/lib/workspace';

const schema = z.object({ name: z.string().trim().min(2).max(120), triggerType: z.enum(['manual', 'scan_threshold', 'schedule']), campaignId: z.string().uuid().optional(), threshold: z.coerce.number().int().min(1).max(1000000).optional(), intervalMinutes: z.coerce.number().int().min(15).max(10080).optional(), actionType: z.enum(['set_campaign_status', 'send_webhook']), status: z.enum(['active', 'paused']).optional(), integrationId: z.string().uuid().optional(), enabled: z.boolean().default(false), cooldownMinutes: z.coerce.number().int().min(15).max(10080).default(60) });
export async function POST(request: Request) {
  const supabase = await createClient();
  const context = await getWorkspaceContext(supabase);
  if ('error' in context) return NextResponse.json({ error: context.error }, { status: 401 });
  if (!hasWorkspaceRole(context.organization.role, 'manager')) return NextResponse.json({ error: 'Manager access is required.' }, { status: 403 });
  if (!hasEntitlement(context.organization.plan, 'automation.engine')) return NextResponse.json({ error: 'Automation requires Pro or higher.' }, { status: 403 });
  const parsed = schema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: 'Check the automation configuration.' }, { status: 400 });
  if ((parsed.data.triggerType === 'scan_threshold' || parsed.data.actionType === 'set_campaign_status') && !parsed.data.campaignId) return NextResponse.json({ error: 'Choose a campaign for this rule.' }, { status: 400 });
  if (parsed.data.actionType === 'send_webhook' && !parsed.data.integrationId) return NextResponse.json({ error: 'Choose a webhook integration.' }, { status: 400 });
  if (parsed.data.campaignId) {
    const { data: campaign } = await supabase.from('qr_codes').select('id').eq('id', parsed.data.campaignId).eq('organization_id', context.organization.id).maybeSingle();
    if (!campaign) return NextResponse.json({ error: 'Campaign not found.' }, { status: 400 });
  }
  const triggerConfig = parsed.data.triggerType === 'scan_threshold' ? { campaign_id: parsed.data.campaignId, threshold: parsed.data.threshold || 1 } : parsed.data.triggerType === 'schedule' ? { interval_minutes: parsed.data.intervalMinutes || 60 } : {};
  const actionConfig = parsed.data.actionType === 'set_campaign_status' ? { campaign_id: parsed.data.campaignId, status: parsed.data.status || 'paused' } : { integration_id: parsed.data.integrationId };
  const { data, error } = await supabase.from('automation_rules').insert({ organization_id: context.organization.id, name: parsed.data.name, trigger_type: parsed.data.triggerType, trigger_config: triggerConfig, action_type: parsed.data.actionType, action_config: actionConfig, enabled: parsed.data.enabled, cooldown_minutes: parsed.data.cooldownMinutes, created_by: context.userId }).select('id,name,enabled').single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data, { status: 201 });
}
export async function PATCH(request: Request) {
  const supabase = await createClient();
  const context = await getWorkspaceContext(supabase);
  if ('error' in context) return NextResponse.json({ error: context.error }, { status: 401 });
  if (!hasWorkspaceRole(context.organization.role, 'manager')) return NextResponse.json({ error: 'Manager access is required.' }, { status: 403 });
  const parsed = z.object({ id: z.string().uuid(), enabled: z.boolean() }).safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: 'Invalid automation update.' }, { status: 400 });
  const { data, error } = await supabase.from('automation_rules').update({ enabled: parsed.data.enabled }).eq('id', parsed.data.id).eq('organization_id', context.organization.id).select('id,enabled').maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  if (!data) return NextResponse.json({ error: 'Automation not found.' }, { status: 404 });
  return NextResponse.json(data);
}
