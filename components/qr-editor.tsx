'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

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
        <div className="field full"><span>Permanent link</span><p className="codeurl">/r/{code.slug}</p></div>
      </div>
      <div className="actions"><button className="btn" type="button" disabled={busy} onClick={save}>{busy ? 'Saving...' : 'Save changes'}</button><Link className="btn secondary" href="/dashboard/qr-codes">Back to library</Link></div>
      {message && <p className="notice" role="status">{message}</p>}
    </section>
  );
}
