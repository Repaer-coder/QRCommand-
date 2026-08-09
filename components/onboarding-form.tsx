'use client';

import { type FormEvent, useState } from 'react';

export default function OnboardingForm({ defaultName }: { defaultName: string }) {
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage('Creating your command center...');
    const form = new FormData(event.currentTarget);
    const response = await fetch('/api/onboarding', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ workspaceName: form.get('workspaceName'), businessType: form.get('businessType'), locationName: form.get('locationName'), locationAddress: form.get('locationAddress') }),
    });
    const body = await response.json().catch(() => ({}));
    setBusy(false);
    if (!response.ok) return setMessage(body.error || 'Could not complete onboarding.');
    window.location.assign('/dashboard');
  }
  return <form className="card onboarding-form" onSubmit={submit}><div className="stepmark">01 / Business profile</div><label className="field">Workspace name<input className="input" name="workspaceName" defaultValue={defaultName} required /></label><label className="field">Business type<select className="input" name="businessType" defaultValue="services"><option value="restaurant">Restaurant or hospitality</option><option value="retail">Retail</option><option value="services">Local or professional services</option><option value="agency">Agency</option><option value="creator">Creator or brand</option><option value="other">Other</option></select></label><div className="stepmark">02 / First location <span>optional</span></div><label className="field">Location name<input className="input" name="locationName" placeholder="Downtown, Main office, Flagship store..." /></label><label className="field">Address<textarea className="input" name="locationAddress" rows={3} /></label><button className="btn" disabled={busy}>{busy ? 'Setting up...' : 'Open command dashboard'}</button>{message && <p className="notice" role="status">{message}</p>}</form>;
}
