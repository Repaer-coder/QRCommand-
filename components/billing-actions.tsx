'use client';

import { useState } from 'react';
import type { PaidPlanName } from '@/lib/plans';

export function CheckoutButton({ plan, disabled = false }: { plan: PaidPlanName; disabled?: boolean }) {
  const [busy, setBusy] = useState(false);
  async function submit() {
    setBusy(true);
    const response = await fetch('/api/checkout', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ plan }) });
    const data = await response.json().catch(() => ({}));
    setBusy(false);
    if (!response.ok || !data.url) return window.alert(data.error || 'Could not start checkout.');
    window.location.assign(data.url);
  }
  return <button className="btn" type="button" disabled={disabled || busy} onClick={submit}>{busy ? 'Opening checkout...' : disabled ? 'Current plan' : 'Choose plan'}</button>;
}

export function PortalButton() {
  const [busy, setBusy] = useState(false);
  async function openPortal() {
    setBusy(true);
    const response = await fetch('/api/portal', { method: 'POST' });
    const data = await response.json().catch(() => ({}));
    setBusy(false);
    if (!response.ok || !data.url) return window.alert(data.error || 'Could not open the billing portal.');
    window.location.assign(data.url);
  }
  return <button className="btn secondary" type="button" disabled={busy} onClick={openPortal}>{busy ? 'Opening portal...' : 'Manage subscription'}</button>;
}
