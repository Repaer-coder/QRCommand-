import { createHmac, randomUUID } from 'node:crypto';
import type { SupabaseClient } from '@supabase/supabase-js';
import { decryptSecret } from '@/lib/encryption';
import { validatePublicHttpsUrl } from '@/lib/security';

export interface AutomationRule {
  id: string;
  organization_id: string;
  name: string;
  trigger_type: string;
  trigger_config: Record<string, unknown>;
  condition_config: Record<string, unknown>;
  action_type: string;
  action_config: Record<string, unknown>;
  enabled: boolean;
  cooldown_minutes: number;
  max_runs_per_hour: number;
  retry_limit: number;
  last_run_at: string | null;
}

export async function isRuleDue(supabase: SupabaseClient, rule: AutomationRule) {
  if (!rule.enabled) return false;
  if (rule.last_run_at) {
    const cooldownEnds = new Date(rule.last_run_at).getTime() + rule.cooldown_minutes * 60000;
    if (cooldownEnds > Date.now()) return false;
  }
  const oneHourAgo = new Date(Date.now() - 3600000).toISOString();
  const { count } = await supabase
    .from('automation_runs')
    .select('id', { count: 'exact', head: true })
    .eq('rule_id', rule.id)
    .gte('started_at', oneHourAgo)
    .in('status', ['succeeded', 'running']);
  return (count ?? 0) < rule.max_runs_per_hour;
}

async function campaignForRule(supabase: SupabaseClient, rule: AutomationRule, id: unknown) {
  if (typeof id !== 'string') throw new Error('Rule campaign is missing.');
  const { data } = await supabase
    .from('qr_codes')
    .select('id,name,status,scan_count')
    .eq('id', id)
    .eq('organization_id', rule.organization_id)
    .maybeSingle();
  if (!data) throw new Error('Rule campaign was not found in this workspace.');
  return data;
}

export async function executeAutomationRule(
  supabase: SupabaseClient,
  rule: AutomationRule,
  actorUserId: string | null,
  source: 'manual' | 'cron'
) {
  const runId = randomUUID();
  const started = await supabase.from('automation_runs').insert({ id: runId, organization_id: rule.organization_id, rule_id: rule.id, status: 'running' });
  if (started.error) throw new Error(started.error.message);
  try {
    if (rule.trigger_type === 'scan_threshold') {
      const campaign = await campaignForRule(supabase, rule, rule.trigger_config.campaign_id);
      const threshold = Number(rule.trigger_config.threshold || 0);
      if (!Number.isFinite(threshold) || campaign.scan_count < threshold) {
        await supabase.from('automation_runs').update({ status: 'skipped', output: { reason: 'threshold_not_met', current: campaign.scan_count, threshold }, completed_at: new Date().toISOString() }).eq('id', runId);
        return { runId, status: 'skipped', message: 'Scan threshold has not been met.' };
      }
    }
    let output: Record<string, unknown> = {};
    if (rule.action_type === 'set_campaign_status') {
      const campaign = await campaignForRule(supabase, rule, rule.action_config.campaign_id);
      const status = rule.action_config.status;
      if (status !== 'active' && status !== 'paused') throw new Error('Unsupported campaign status action.');
      const result = await supabase.from('qr_codes').update({ status }).eq('id', campaign.id).eq('organization_id', rule.organization_id);
      if (result.error) throw new Error(result.error.message);
      output = { campaignId: campaign.id, campaignName: campaign.name, status };
    } else if (rule.action_type === 'send_webhook') {
      const integrationId = rule.action_config.integration_id;
      if (typeof integrationId !== 'string') throw new Error('Webhook integration is missing.');
      const { data: integration } = await supabase.from('integrations').select('id,status,config,encrypted_secret').eq('id', integrationId).eq('organization_id', rule.organization_id).maybeSingle();
      if (!integration || integration.status !== 'connected' || !integration.encrypted_secret) throw new Error('Webhook integration is not connected.');
      const endpoint = await validatePublicHttpsUrl(String(integration.config?.endpoint_url || ''));
      if (!endpoint) throw new Error('Webhook endpoint is not a safe public HTTPS URL.');
      const payload = JSON.stringify({ event: 'qr_command.automation', rule: { id: rule.id, name: rule.name }, organizationId: rule.organization_id, source, occurredAt: new Date().toISOString() });
      const signature = createHmac('sha256', decryptSecret(integration.encrypted_secret)).update(payload).digest('hex');
      const response = await fetch(endpoint, { method: 'POST', headers: { 'content-type': 'application/json', 'x-qr-command-signature': `sha256=${signature}` }, body: payload, signal: AbortSignal.timeout(10000), redirect: 'error' });
      if (!response.ok) throw new Error(`Webhook returned HTTP ${response.status}.`);
      output = { integrationId, responseStatus: response.status };
    } else {
      throw new Error('Unsupported automation action.');
    }
    await Promise.all([
      supabase.from('automation_runs').update({ status: 'succeeded', output, completed_at: new Date().toISOString() }).eq('id', runId),
      supabase.from('automation_rules').update({ last_run_at: new Date().toISOString() }).eq('id', rule.id),
      supabase.from('audit_log').insert({ organization_id: rule.organization_id, actor_user_id: actorUserId, action: 'automation.executed', target_type: 'automation_rule', target_id: rule.id, details: { source, output } }),
    ]);
    return { runId, status: 'succeeded', output };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Automation failed.';
    await supabase.from('automation_runs').update({ status: 'failed', error: message, completed_at: new Date().toISOString() }).eq('id', runId);
    throw new Error(message);
  }
}
