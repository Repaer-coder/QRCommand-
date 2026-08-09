'use client';

import { type FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';

type Rule = { id: string; name: string; trigger_type: string; action_type: string; enabled: boolean; last_run_at: string | null };
export default function AutomationManager({ rules, runs, campaigns, integrations }: { rules: Rule[]; runs: Array<{ id: string; rule_id: string; status: string; error: string | null; started_at: string }>; campaigns: Array<{ id: string; name: string }>; integrations: Array<{ id: string; name: string }> }) {
  const router = useRouter();
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState('');
  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy('create');
    const form = new FormData(event.currentTarget);
    const response = await fetch('/api/automations', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ name: form.get('name'), triggerType: form.get('triggerType'), campaignId: form.get('campaignId') || undefined, threshold: form.get('threshold') || undefined, intervalMinutes: form.get('intervalMinutes') || undefined, actionType: form.get('actionType'), status: form.get('status') || undefined, integrationId: form.get('integrationId') || undefined, enabled: form.get('enabled') === 'on', cooldownMinutes: form.get('cooldownMinutes') }) });
    const body = await response.json().catch(() => ({}));
    setBusy('');
    setMessage(response.ok ? 'Automation rule created.' : body.error || 'Could not create the rule.');
    if (response.ok) { event.currentTarget.reset(); router.refresh(); }
  }
  async function toggle(rule: Rule) {
    setBusy(rule.id);
    const response = await fetch('/api/automations', { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id: rule.id, enabled: !rule.enabled }) });
    const body = await response.json().catch(() => ({}));
    setBusy('');
    if (!response.ok) return window.alert(body.error || 'Could not update the rule.');
    router.refresh();
  }
  async function run(rule: Rule) {
    setBusy(rule.id);
    const response = await fetch(`/api/automations/${rule.id}/run`, { method: 'POST' });
    const body = await response.json().catch(() => ({}));
    setBusy('');
    setMessage(response.ok ? `Rule finished: ${body.status}.` : body.error || 'Rule failed.');
    router.refresh();
  }
  return <div className="stack"><section className="card"><div className="sectionhead"><div><div className="eyebrow">Safe trigger to action</div><h2>Create an automation rule</h2></div><span className="pill">No arbitrary code</span></div><form className="formgrid" onSubmit={create}><label className="field">Rule name<input className="input" name="name" required placeholder="Pause campaign after milestone" /></label><label className="field">Trigger<select className="input" name="triggerType" defaultValue="manual"><option value="manual">Manual or API run</option><option value="scan_threshold">Scan threshold</option><option value="schedule">Scheduled check</option></select></label><label className="field">Campaign<select className="input" name="campaignId" defaultValue=""><option value="">Choose if needed</option>{campaigns.map((campaign) => <option key={campaign.id} value={campaign.id}>{campaign.name}</option>)}</select></label><label className="field">Scan threshold<input className="input" name="threshold" type="number" min="1" placeholder="100" /></label><label className="field">Schedule interval (minutes)<input className="input" name="intervalMinutes" type="number" min="15" defaultValue="60" /></label><label className="field">Action<select className="input" name="actionType" defaultValue="set_campaign_status"><option value="set_campaign_status">Set campaign status</option><option value="send_webhook">Send signed webhook</option></select></label><label className="field">Campaign status<select className="input" name="status" defaultValue="paused"><option value="paused">Pause</option><option value="active">Activate</option></select></label><label className="field">Webhook integration<select className="input" name="integrationId" defaultValue=""><option value="">Choose if needed</option>{integrations.map((integration) => <option key={integration.id} value={integration.id}>{integration.name}</option>)}</select></label><label className="field">Cooldown (minutes)<input className="input" name="cooldownMinutes" type="number" min="15" defaultValue="60" /></label><label className="checkfield"><input type="checkbox" name="enabled" /> Enable after creation</label><button className="btn" disabled={Boolean(busy)}>{busy === 'create' ? 'Creating...' : 'Create rule'}</button></form>{message && <p className="notice" role="status">{message}</p>}</section><section className="card table-card"><h2>Automation rules</h2>{rules.length ? <div className="data-table"><div className="data-row data-head"><span>Rule</span><span>Trigger</span><span>Last run</span><span>Controls</span></div>{rules.map((rule) => <div className="data-row" key={rule.id}><span><b>{rule.name}</b><small>{rule.action_type.replaceAll('_', ' ')}</small></span><span>{rule.trigger_type.replaceAll('_', ' ')}</span><span>{rule.last_run_at ? new Date(rule.last_run_at).toLocaleString() : 'Never'}</span><span className="rowactions"><button className="mini" disabled={busy === rule.id} onClick={() => run(rule)}>Run now</button><button className={`mini ${rule.enabled ? 'danger' : ''}`} disabled={busy === rule.id} onClick={() => toggle(rule)}>{rule.enabled ? 'Disable' : 'Enable'}</button></span></div>)}</div> : <p className="muted">No automation rules yet.</p>}</section><section className="card table-card"><h2>Recent runs</h2>{runs.length ? <div className="data-table"><div className="data-row data-head"><span>Run</span><span>Status</span><span>Started</span><span>Error</span></div>{runs.map((run) => <div className="data-row" key={run.id}><code>{run.id.slice(0, 8)}</code><span className={`status ${run.status}`}>{run.status}</span><span>{new Date(run.started_at).toLocaleString()}</span><span>{run.error || 'None'}</span></div>)}</div> : <p className="muted">Run history appears after a rule is executed.</p>}</section></div>;
}
