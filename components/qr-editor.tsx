'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import QRCode from 'qrcode';

export default function QREditor({
  code,
  locations,
}: {
  code: { id: string; name: string; destination_url: string; status: string; slug: string; location_id: string | null; style: { fg?: string; bg?: string } | null };
  locations: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [name, setName] = useState(code.name);
  const [destinationUrl, setDestinationUrl] = useState(code.destination_url);
  const [status, setStatus] = useState(code.status);
  const [locationId, setLocationId] = useState(code.location_id ?? '');
  const [fg, setFg] = useState(code.style?.fg ?? '#07111f');
  const [bg, setBg] = useState(code.style?.bg ?? '#ffffff');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [qrImage, setQrImage] = useState('');
  const shortLink = useMemo(() => (typeof window === 'undefined' ? `/r/${code.slug}` : `${window.location.origin}/r/${code.slug}`), [code.slug]);

  useEffect(() => {
    let cancelled = false;
    void QRCode.toDataURL(shortLink, {
      width: 280,
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

  async function downloadQr() {
    const data = qrImage || (await QRCode.toDataURL(shortLink, {
      width: 1400,
      margin: 2,
      errorCorrectionLevel: 'H',
      color: { dark: fg, light: bg },
    }));
    const anchor = document.createElement('a');
    anchor.href = data;
    anchor.download = `${code.slug}.png`;
    anchor.click();
  }

  async function save() {
    setBusy(true);
    setMessage('Saving changes...');
    const response = await fetch(`/api/qr/${code.id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name, destination_url: destinationUrl, status, location_id: locationId || null, style: { fg, bg } }),
    });
    const body = await response.json().catch(() => ({}));
    setBusy(false);
    setMessage(response.ok ? 'Campaign updated. Destination changes are live now.' : body.error || 'Could not save campaign.');
    if (response.ok) router.refresh();
  }

  return (
    <section className="card editcard">
      <div className="sectionhead"><div><div className="eyebrow">Permanent campaign</div><h2>{code.name}</h2></div><span className={`status ${status}`}>{status}</span></div>
      <div className="formgrid">
        <label className="field">Campaign name<input className="input" value={name} onChange={(event) => setName(event.target.value)} /></label>
        <label className="field">Status<select className="input" value={status} onChange={(event) => setStatus(event.target.value)}><option value="active">Active</option><option value="paused">Paused</option></select></label>
        <label className="field full">Destination URL<input className="input" type="url" value={destinationUrl} onChange={(event) => setDestinationUrl(event.target.value)} /></label>
        <label className="field full">Location<select className="input" value={locationId} onChange={(event) => setLocationId(event.target.value)}><option value="">Workspace-wide campaign</option>{locations.map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}</select></label>
        <label className="field">Foreground<input className="colorinput" type="color" value={fg} onChange={(event) => setFg(event.target.value)} /></label>
        <label className="field">Background<input className="colorinput" type="color" value={bg} onChange={(event) => setBg(event.target.value)} /></label>
        <div className="field full">
          <span>Permanent link</span>
          <a className="codeurl" href={shortLink} target="_blank" rel="noopener noreferrer">
            {shortLink}
          </a>
        </div>
      </div>
      <div className="preview-panel">
        <span className="pill">Scannable QR preview</span>
        {qrImage ? (
          <a href={shortLink} target="_blank" rel="noopener noreferrer">
            <img
              alt={`Permanent QR for ${code.slug}`}
              src={qrImage}
              width={280}
              height={280}
              style={{ background: '#ffffff', borderRadius: '14px', padding: '8px', border: '1px solid var(--line)' }}
            />
          </a>
        ) : (
          <div className="qrbox">
            <small className="muted">Generating QR...</small>
          </div>
        )}
        <div className="actions">
          <a className="btn secondary" href={shortLink} target="_blank" rel="noopener noreferrer">
            Test link
          </a>
          <button className="btn" type="button" onClick={downloadQr}>
            Download QR
          </button>
        </div>
      </div>
      <div className="actions"><button className="btn" type="button" disabled={busy} onClick={save}>{busy ? 'Saving...' : 'Save changes'}</button><Link className="btn secondary" href="/dashboard/qr-codes">Back to library</Link></div>
      {message && <p className="notice" role="status">{message}</p>}
    </section>
  );
}
