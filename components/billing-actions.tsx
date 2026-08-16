'use client';

import { useI18n } from '@/components/i18n-provider';
import { useState } from 'react';
import type { PaidPlanName } from '@/lib/plans';

export function CheckoutButton({ plan, disabled = false }: { plan: PaidPlanName; disabled?: boolean }) {
  const { t } = useI18n();
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    const response = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ plan }),
    });
    const data = await response.json().catch(() => ({}));
    setBusy(false);
    if (!response.ok || !data.url) return window.alert(data.error || t('dashboard.billing.checkoutError'));
    window.location.assign(data.url);
  }

  return (
    <button className="btn" type="button" disabled={disabled || busy} onClick={submit}>
      {busy ? t('dashboard.billing.openCheckout') : disabled ? t('billing.currentPlan') : t('billing.choosePlan')}
    </button>
  );
}

export function PortalButton() {
  const { t } = useI18n();
  const [busy, setBusy] = useState(false);

  async function openPortal() {
    setBusy(true);
    const response = await fetch('/api/portal', { method: 'POST' });
    const data = await response.json().catch(() => ({}));
    setBusy(false);
    if (!response.ok || !data.url) return window.alert(data.error || t('dashboard.billing.portalError'));
    window.location.assign(data.url);
  }

  return (
    <button className="btn secondary" type="button" disabled={busy} onClick={openPortal}>
      {busy ? t('dashboard.billing.openingPortal') : t('dashboard.billing.openPortal')}
    </button>
  );
}
