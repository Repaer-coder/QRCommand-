'use client';

import { type FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SettingsForm({ name, businessType }: { name: string; businessType: string | null }) {
  const router = useRouter();
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    const form = new FormData(event.currentTarget);
    const response = await fetch('/api/settings', { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ name: form.get('name'), businessType: form.get('businessType') }) });
    const body = await response.json().catch(() => ({}));
    setBusy(false);
    setMessage(response.ok ? 'Workspace settings saved.' : body.error || 'Could not save settings.');
    if (response.ok) router.refresh();
  }
  return <form className="card formcard" onSubmit={submit}><label className="field">Workspace name<input className="input" name="name" defaultValue={name} required /></label><label className="field">Business type<select className="input" name="businessType" defaultValue={businessType ?? 'other'}><option value="restaurant">Restaurant or hospitality</option><option value="retail">Retail</option><option value="services">Local or professional services</option><option value="agency">Agency</option><option value="creator">Creator or brand</option><option value="other">Other</option></select></label><button className="btn" disabled={busy}>{busy ? 'Saving...' : 'Save workspace'}</button>{message && <p className="notice" role="status">{message}</p>}</form>;
}
