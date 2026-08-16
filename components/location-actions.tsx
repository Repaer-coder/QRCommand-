'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/components/i18n-provider';

export default function LocationActions({ id, name, canDelete }: { id: string; name: string; canDelete: boolean }) {
  const router = useRouter();
  const { t } = useI18n();
  const [busy, setBusy] = useState(false);
  async function remove() {
    const message = t('location.deleteMessage').replace('{name}', name);
    if (!window.confirm(message)) return;
    setBusy(true);
    const response = await fetch(`/api/locations/${id}`, { method: 'DELETE' });
    const body = await response.json().catch(() => ({}));
    setBusy(false);
    if (!response.ok) return window.alert(body.error || t('location.deleteFailed'));
    router.refresh();
  }
  return <div className="rowactions"><a className="mini" href={`/dashboard/locations/${id}`}>{t('location.edit')}</a>{canDelete && <button className="mini danger" disabled={busy} type="button" onClick={remove}>{busy ? t('location.deleting') : t('location.delete')}</button>}</div>;
}
