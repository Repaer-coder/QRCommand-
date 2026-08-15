'use client';

import { type FormEvent, useState } from 'react';
import { useI18n } from '@/components/i18n-provider';

export default function OnboardingForm({ defaultName }: { defaultName: string }) {
  const { t } = useI18n();
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage(t('onboarding.formMessage'));
    const form = new FormData(event.currentTarget);
    const response = await fetch('/api/onboarding', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        workspaceName: form.get('workspaceName'),
        businessType: form.get('businessType'),
        locationName: form.get('locationName'),
        locationAddress: form.get('locationAddress'),
      }),
    });
    const body = await response.json().catch(() => ({}));
    setBusy(false);
    if (!response.ok) return setMessage(body.error || t('onboarding.failureMessage'));
    window.location.assign('/dashboard');
  }

  return (
    <form className="card onboarding-form" onSubmit={submit}>
      <div className="stepmark">{t('onboarding.formStepOne')}</div>
      <label className="field">
        {t('onboarding.workspaceName')}
        <input className="input" name="workspaceName" defaultValue={defaultName} required />
      </label>
      <label className="field">
        {t('onboarding.businessType')}
        <select className="input" name="businessType" defaultValue="services">
          <option value="restaurant">{t('onboarding.businessTypeRestaurant')}</option>
          <option value="retail">{t('onboarding.businessTypeRetail')}</option>
          <option value="services">{t('onboarding.businessTypeServices')}</option>
          <option value="agency">{t('onboarding.businessTypeAgency')}</option>
          <option value="creator">{t('onboarding.businessTypeCreator')}</option>
          <option value="other">{t('onboarding.businessTypeOther')}</option>
        </select>
      </label>
      <div className="stepmark">
        {t('onboarding.formStepTwo')} <span>{t('onboarding.optional')}</span>
      </div>
      <label className="field">
        {t('onboarding.locationName')}
        <input className="input" name="locationName" placeholder={t('onboarding.locationPlaceholder')} />
      </label>
      <label className="field">
        {t('onboarding.locationAddress')}
        <textarea className="input" name="locationAddress" rows={3} />
      </label>
      <button className="btn" disabled={busy}>{busy ? t('onboarding.formWorking') : t('onboarding.submit')}</button>
      {message && <p className="notice" role="status">{message}</p>}
    </form>
  );
}
