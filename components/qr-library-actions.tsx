'use client';

import QRCode from 'qrcode';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function QRLibraryActions({ id, slug, name, status, style, canDelete }: { id: string; slug: string; name: string; status: string; style?: { fg?: string; bg?: string } | null; canDelete: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const shortLink = useMemo(() => (typeof window === 'undefined' ? `/r/${slug}` : `${window.location.origin}/r/${slug}`), [slug]);
  const [qrImage, setQrImage] = useState('');
  const fg = style?.fg ?? '#07111f';
  const bg = style?.bg ?? '#ffffff';

  useEffect(() => {
    let cancelled = false;
    void QRCode.toDataURL(shortLink, {
      width: 240,
      margin: 2,
      errorCorrectionLevel: 'H',
      color: { dark: fg, light: bg },
    }).then((value) => {
      if (!cancelled) setQrImage(value);
    });
    return () => {
      cancelled = true;
    };
  }, [shortLink, fg, bg]);

  async function download() {
    const data = qrImage || (await QRCode.toDataURL(shortLink, {
      width: 1400,
      margin: 2,
      errorCorrectionLevel: 'H',
      color: { dark: fg, light: bg },
    }));
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

  return (
    <div className="qr-library-actions">
      <a className="codeurl" href={shortLink} target="_blank" rel="noopener noreferrer">
        {shortLink}
      </a>
      {qrImage ? (
        <a href={shortLink} target="_blank" rel="noopener noreferrer">
          <img
            alt={`Permanent QR for ${slug}`}
            src={qrImage}
            width={130}
            height={130}
            style={{ background: '#ffffff', borderRadius: '10px', padding: '6px', border: '1px solid var(--line)' }}
          />
        </a>
      ) : (
        <div
          className="qrbox"
          style={{ width: 130, minHeight: 130, margin: '2px 0 0', padding: 8, display: 'grid', placeItems: 'center' }}
        >
          <small className="muted">Generating QR...</small>
        </div>
      )}
      <div className="actions">
        <a className="mini" href={shortLink} target="_blank" rel="noopener noreferrer">
          Test link
        </a>
        <button className="mini" type="button" onClick={download}>
          Download
        </button>
      </div>
      <div className="rowactions">
        <a className="mini" href={`/dashboard/qr-codes/${id}`}>
          Edit
        </a>
        <button className="mini" type="button" disabled={busy} onClick={() => update({ status: status === 'active' ? 'paused' : 'active' })}>
          {status === 'active' ? 'Pause' : 'Activate'}
        </button>
        <button className="mini danger" type="button" disabled={busy} onClick={() => canDelete ? remove() : update({ status: 'archived' })}>
          {canDelete ? 'Delete' : 'Archive'}
        </button>
      </div>
    </div>
  );
}
