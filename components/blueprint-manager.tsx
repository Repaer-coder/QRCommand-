'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { blueprintTemplates } from '@/components/growth-blueprints';

export default function BlueprintManager({ instances, canManage }: { instances: Array<{ id: string; template_key: string; name: string; status: string; configuration: Record<string, unknown>; created_at: string }>; canManage: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState('');
  async function create(templateKey: string) {
    setBusy(templateKey);
    const response = await fetch('/api/blueprints', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ templateKey }) });
    const body = await response.json().catch(() => ({}));
    setBusy('');
    if (!response.ok) return window.alert(body.error || 'Could not create the blueprint.');
    router.refresh();
  }
  async function setStatus(id: string, status: string) {
    setBusy(id);
    const response = await fetch('/api/blueprints', { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id, status }) });
    const body = await response.json().catch(() => ({}));
    setBusy('');
    if (!response.ok) return window.alert(body.error || 'Could not update the blueprint.');
    router.refresh();
  }
  return <div className="stack"><section className="blueprints">{blueprintTemplates.map((template) => <article className="card blueprint" key={template.key}><span className="pill">{template.audience}</span><h2>{template.name}</h2><strong>{template.outcome}</strong><ul>{template.items.map((item) => <li key={item}>{item}</li>)}</ul>{canManage && <button className="btn" disabled={Boolean(busy)} onClick={() => create(template.key)}>{busy === template.key ? 'Creating...' : 'Use blueprint'}</button>}</article>)}</section><section className="card table-card"><div className="sectionhead"><div><h2>Workspace playbooks</h2><p className="muted">Each instance is independently configurable and scoped to this workspace.</p></div></div>{instances.length ? <div className="data-table"><div className="data-row data-head"><span>Name</span><span>Template</span><span>Status</span><span>Control</span></div>{instances.map((instance) => <div className="data-row" key={instance.id}><b>{instance.name}</b><span>{instance.template_key.replaceAll('-', ' ')}</span><span className={`status ${instance.status}`}>{instance.status}</span><span>{canManage && <select className="input compact" value={instance.status} disabled={busy === instance.id} onChange={(event) => setStatus(instance.id, event.target.value)}><option value="draft">Draft</option><option value="active">Active</option><option value="paused">Paused</option><option value="completed">Completed</option></select>}</span></div>)}</div> : <p className="muted">No blueprint instances yet. Choose a template above to create one.</p>}</section></div>;
}
