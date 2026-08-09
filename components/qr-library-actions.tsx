'use client';

import QRCode from 'qrcode';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function QRLibraryActions({ id, slug, name, status, style, canDelete }: { id: string; slug: string; name: string; status: string; style?: { fg?: string; bg?: string } | null; canDelete: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const shortLink = typeof window === 'undefined' ? `/r/${slug}` : `${window.location.origin}/r/${slug}`;

  async function download() {
    const data = await QRCode.toDataURL(shortLink, { width: 1400, margin: 2, errorCorrectionLevel: 'H', color: { dark: style?.fg ?? '#07111f', light: style?.bg ?? '#ffffff' } });
    const anchor = document.createElement('a');
    anchor.href = data;
    anchor.download = `${slug}.png`;
    anchor.click();
  }

  async function update(payload: Record<string, string>) {
    setBusy(true);
    const response = await fetch(`/api/qr/${id}`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) });
    const body = await response.json().catch(() => ({}));
    setBusy(false);
    if (!response.ok) return window.alert(body.error || 'Could not update this campaign.');
    router.refresh();
  }

  async function remove() {
    if (!window.confirm(`Permanently delete "${name}" and its scan history?`)) return;
    setBusy(true);
    const response = await fetch(`/api/qr/${id}`, { method: 'DELETE' });
    const body = await response.json().catch(() => ({}));
    setBusy(false);
    if (!response.ok) return window.alert(body.error || 'Could not delete this campaign.');
    router.refresh();
  }

  return <div className="rowactions"><a className="mini" href={`/dashboard/qr-codes/${id}`}>Edit</a><button className="mini" type="button" onClick={download}>Download</button><button className="mini" type="button" disabled={busy} onClick={() => update({ status: status === 'active' ? 'paused' : 'active' })}>{status === 'active' ? 'Pause' : 'Activate'}</button><button className="mini danger" type="button" disabled={busy} onClick={() => canDelete ? remove() : update({ status: 'archived' })}>{canDelete ? 'Delete' : 'Archive'}</button></div>;
}
