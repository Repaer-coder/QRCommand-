'use client';

import { type FormEvent, useState } from 'react';
import { useI18n } from '@/components/i18n-provider';
import { useRouter } from 'next/navigation';

const businessTypeOptions = ['restaurant', 'retail', 'services', 'agency', 'creator', 'other'] as const;

export default function SettingsForm({ name, businessType }: { name: string; businessType: string | null }) {
  const { t } = useI18n();
  const router = useRouter();
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    const form = new FormData(event.currentTarget);
    const response = await fetch('/api/settings', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: form.get('name'), businessType: form.get('businessType') }),
    });
    const body = await response.json().catch(() => ({}));
    setBusy(false);
    setMessage(response.ok ? t('dashboard.settings.saved') : body.error || t('dashboard.settings.saveFailed'));
    if (response.ok) router.refresh();
  }

  return (
    <form className="card formcard" onSubmit={submit}>
      <label className="field">
        {t('dashboard.settings.nameLabel')}
        <input className="input" name="name" defaultValue={name} required placeholder={t('dashboard.settings.nameLabel')} />
      </label>

      <label className="field">
        {t('dashboard.settings.businessType')}
        <select className="input" name="businessType" defaultValue={businessType ?? 'other'}>
          {businessTypeOptions.map((option) => (
            <option key={option} value={option}>
              {t(`dashboard.settings.businessType${option === 'services' ? 'Services' : option === 'creator' ? 'Creator' : option === 'other' ? 'Other' : option === 'retail' ? 'Retail' : option === 'agency' ? 'Agency' : option === 'restaurant' ? 'Restaurant' : 'Other'}`)}
            </option>
          ))}
        </select>
      </label>

      <button className="btn" disabled={busy}>
        {busy ? t('common.saving') : t('dashboard.settings.save')}
      </button>
      {message && <p className="notice" role="status">{message}</p>}
    </form>
  );
}
