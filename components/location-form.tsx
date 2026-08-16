'use client';

import { type FormEvent, useState } from 'react';
import Link from 'next/link';
import { useI18n } from '@/components/i18n-provider';
import { useRouter } from 'next/navigation';

export default function LocationForm({ location }: { location?: { id: string; name: string; address: string | null } }) {
  const { t } = useI18n();
  const router = useRouter();
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage(t('location.saving'));
    const form = new FormData(event.currentTarget);
    const response = await fetch(location ? `/api/locations/${location.id}` : '/api/locations', {
      method: location ? 'PATCH' : 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: form.get('name'), address: form.get('address') }),
    });
    const body = await response.json().catch(() => ({}));
    setBusy(false);
    if (!response.ok) return setMessage(body.error || t('location.saveFailed'));
    router.push('/dashboard/locations');
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="card formcard">
      <label className="field">
        {t('location.nameLabel')}
        <input className="input" name="name" required defaultValue={location?.name} placeholder={t('location.namePlaceholder')} />
      </label>
      <label className="field">
        {t('location.addressLabel')}
        <textarea
          name="address"
          className="input"
          rows={3}
          defaultValue={location?.address ?? ''}
          placeholder={t('location.addressPlaceholder')}
        />
      </label>
      <div className="actions">
        <button className="btn" disabled={busy}>
          {busy ? t('location.saving') : location ? t('location.save') : t('location.addLocation')}
        </button>
        <Link className="btn secondary" href="/dashboard/locations">
          {t('common.cancel')}
        </Link>
      </div>
      {message && <p className="notice" role="status">{message}</p>}
    </form>
  );
}
