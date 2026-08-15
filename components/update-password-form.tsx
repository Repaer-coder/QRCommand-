'use client';

import { type FormEvent, useState } from 'react';
import { useI18n } from '@/components/i18n-provider';
import { createClient } from '@/lib/supabase/client';

export default function UpdatePasswordForm() {
  const { t } = useI18n();
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    const form = new FormData(event.currentTarget);
    const password = String(form.get('password') || '');
    const confirmation = String(form.get('confirmation') || '');
    if (password !== confirmation) {
      setBusy(false);
      return setMessage(t('authPages.updatePassword.mismatch'));
    }

    const result = await createClient().auth.updateUser({ password });
    setBusy(false);
    if (result.error) return setMessage(result.error.message);
    window.location.assign('/dashboard');
  }

  return (
    <form className="card authcard authform" onSubmit={submit}>
      <div className="eyebrow">{t('authPages.updatePassword.title')}</div>
      <h1>{t('authPages.updatePassword.heading')}</h1>
      <label>
        {t('authPages.updatePassword.newPassword')}
        <input
          className="input"
          name="password"
          type="password"
          minLength={8}
          autoComplete="new-password"
          required
        />
      </label>
      <label>
        {t('authPages.updatePassword.confirmPassword')}
        <input
          className="input"
          name="confirmation"
          type="password"
          minLength={8}
          autoComplete="new-password"
          required
        />
      </label>
      <button className="btn" disabled={busy}>{busy ? t('authPages.updatePassword.updating') : t('authPages.updatePassword.submit')}</button>
      {message && <p className="notice" role="status">{message}</p>}
    </form>
  );
}
