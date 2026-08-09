'use client';

import { type FormEvent, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function LocationForm({ location }: { location?: { id: string; name: string; address: string | null } }) {
  const router = useRouter();
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage('Saving location...');
    const form = new FormData(event.currentTarget);
    const response = await fetch(location ? `/api/locations/${location.id}` : '/api/locations', {
      method: location ? 'PATCH' : 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: form.get('name'), address: form.get('address') }),
    });
    const body = await response.json().catch(() => ({}));
    setBusy(false);
    if (!response.ok) return setMessage(body.error || 'Could not save this location.');
    router.push('/dashboard/locations');
    router.refresh();
  }
  return <form onSubmit={submit} className="card formcard"><label className="field">Location name<input className="input" name="name" required defaultValue={location?.name} placeholder="Downtown store" /></label><label className="field">Address<textarea name="address" className="input" rows={3} defaultValue={location?.address ?? ''} placeholder="Street, city, region" /></label><div className="actions"><button className="btn" disabled={busy}>{busy ? 'Saving...' : location ? 'Save changes' : 'Add location'}</button><Link className="btn secondary" href="/dashboard/locations">Cancel</Link></div>{message && <p className="notice" role="status">{message}</p>}</form>;
}
