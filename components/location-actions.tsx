'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LocationActions({ id, name, canDelete }: { id: string; name: string; canDelete: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  async function remove() {
    if (!window.confirm(`Delete ${name}? Campaigns will remain but become workspace-wide.`)) return;
    setBusy(true);
    const response = await fetch(`/api/locations/${id}`, { method: 'DELETE' });
    const body = await response.json().catch(() => ({}));
    setBusy(false);
    if (!response.ok) return window.alert(body.error || 'Could not delete the location.');
    router.refresh();
  }
  return <div className="rowactions"><a className="mini" href={`/dashboard/locations/${id}`}>Edit</a>{canDelete && <button className="mini danger" disabled={busy} type="button" onClick={remove}>{busy ? 'Deleting...' : 'Delete'}</button>}</div>;
}
