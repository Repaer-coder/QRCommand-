'use client';

import { type FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';

type Integration = { id: string; name: string; provider: string; status: string; config: { endpoint_url?: string }; last_tested_at: string | null; last_error: string | null };
export default function IntegrationManager({ integrations }: { integrations: Integration[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState('');
  const [message, setMessage] = useState('');
  const [secret, setSecret] = useState('');
  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy('create'); setSecret('');
    const form = new FormData(event.currentTarget);
    const response = await fetch('/api/integrations', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ name: form.get('name'), endpointUrl: form.get('endpointUrl') }) });
    const body = await response.json().catch(() => ({}));
    setBusy('');
    if (!response.ok) return setMessage(body.error || 'Could not connect the webhook.');
    setSecret(body.signingSecret); setMessage('Webhook connected. Store the signing secret now; it will not be shown again.'); event.currentTarget.reset(); router.refresh();
  }
  async function test(id: string) { setBusy(id); const response = await fetch(`/api/integrations/${id}/test`, { method: 'POST' }); const body = await response.json().catch(() => ({})); setBusy(''); setMessage(response.ok ? `Webhook test succeeded with HTTP ${body.status}.` : body.error || 'Webhook test failed.'); router.refresh(); }
  async function remove(id: string) { if (!window.confirm('Disconnect this integration? Automations using it will fail until reconfigured.')) return; setBusy(id); const response = await fetch(`/api/integrations?id=${encodeURIComponent(id)}`, { method: 'DELETE' }); const body = await response.json().catch(() => ({})); setBusy(''); if (!response.ok) return setMessage(body.error || 'Could not disconnect the integration.'); router.refresh(); }
  return <div className="stack"><section className="card integration-connect"><div><div className="eyebrow">Provider abstraction</div><h2>Connect a signed webhook</h2><p className="muted">Secrets are encrypted at rest. Endpoints must resolve to public HTTPS addresses.</p></div><form className="formgrid" onSubmit={create}><label className="field">Integration name<input className="input" name="name" required placeholder="CRM webhook" /></label><label className="field">HTTPS endpoint<input className="input" name="endpointUrl" type="url" required placeholder="https://hooks.example.com/qr-command" /></label><button className="btn" disabled={Boolean(busy)}>{busy === 'create' ? 'Connecting...' : 'Connect webhook'}</button></form>{secret && <div className="secret-box"><span>Signing secret - shown once</span><code>{secret}</code></div>}{message && <p className="notice" role="status">{message}</p>}</section><section className="integration-grid">{integrations.map((integration) => <article className="card" key={integration.id}><div className="sectionhead"><div><span className="pill">{integration.provider}</span><h2>{integration.name}</h2></div><span className={`status ${integration.status}`}>{integration.status}</span></div><p className="destination">{integration.config?.endpoint_url}</p><p className="muted small">Last tested: {integration.last_tested_at ? new Date(integration.last_tested_at).toLocaleString() : 'Never'}</p>{integration.last_error && <p className="notice">{integration.last_error}</p>}<div className="rowactions"><button className="mini" disabled={busy === integration.id} onClick={() => test(integration.id)}>Send test</button><button className="mini danger" disabled={busy === integration.id} onClick={() => remove(integration.id)}>Disconnect</button></div></article>)}{!integrations.length && <article className="card empty"><h2>No integrations connected</h2><p className="muted">Connect a webhook above, then select it as a safe automation action.</p></article>}</section></div>;
}
