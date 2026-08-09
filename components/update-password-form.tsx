'use client';

import { type FormEvent, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function UpdatePasswordForm() {
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    const form = new FormData(event.currentTarget);
    const password = String(form.get('password') || '');
    const confirmation = String(form.get('confirmation') || '');
    if (password !== confirmation) { setBusy(false); return setMessage('Passwords do not match.'); }
    const result = await createClient().auth.updateUser({ password });
    setBusy(false);
    if (result.error) return setMessage(result.error.message);
    window.location.assign('/dashboard');
  }
  return <form className="card authcard authform" onSubmit={submit}><div className="eyebrow">Account recovery</div><h1>Choose a new password</h1><label>New password<input className="input" name="password" type="password" minLength={8} autoComplete="new-password" required /></label><label>Confirm password<input className="input" name="confirmation" type="password" minLength={8} autoComplete="new-password" required /></label><button className="btn" disabled={busy}>{busy ? 'Updating...' : 'Update password'}</button>{message && <p className="notice" role="status">{message}</p>}</form>;
}
