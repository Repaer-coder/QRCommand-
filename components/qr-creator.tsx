'use client';

import QRCode from 'qrcode';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

const campaignTypes = [
  ['restaurant', 'Restaurant menu and orders'],
  ['reviews', 'Reviews and reputation'],
  ['social', 'Social conversion'],
  ['website', 'Website traffic'],
  ['lead', 'Lead capture'],
  ['coupon', 'Offer or coupon'],
  ['event', 'Event engagement'],
  ['wifi', 'Guest Wi-Fi'],
] as const;

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 50);
}

export default function QRCreator({
  locations = [],
  initialType = 'website',
}: {
  locations?: { id: string; name: string }[];
  initialType?: string;
}) {
  const router = useRouter();
  const canvas = useRef<HTMLCanvasElement>(null);
  const [name, setName] = useState('My first campaign');
  const [type, setType] = useState(campaignTypes.some(([key]) => key === initialType) ? initialType : 'website');
  const [url, setUrl] = useState('https://example.com');
  const [fg, setFg] = useState('#07111f');
  const [bg, setBg] = useState('#ffffff');
  const [slug, setSlug] = useState('my-first-campaign');
  const [locationId, setLocationId] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const dynamicUrl = useMemo(
    () => typeof window === 'undefined' ? `https://your-domain.example/r/${slug}` : `${window.location.origin}/r/${slug}`,
    [slug]
  );

  useEffect(() => {
    if (!canvas.current || !slug) return;
    void QRCode.toCanvas(canvas.current, dynamicUrl, {
      width: 280,
      margin: 2,
      color: { dark: fg, light: bg },
      errorCorrectionLevel: 'H',
    });
  }, [dynamicUrl, fg, bg, slug]);

  function download() {
    const href = canvas.current?.toDataURL('image/png');
    if (!href) return;
    const anchor = document.createElement('a');
    anchor.download = `${slug || 'qr-code'}.png`;
    anchor.href = href;
    anchor.click();
  }

  async function save() {
    if (busy) return;
    setBusy(true);
    setMessage('Saving campaign...');
    const response = await fetch('/api/qr', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name, type, destinationUrl: url, slug, style: { fg, bg }, locationId: locationId || null }),
    });
    const data = await response.json().catch(() => ({}));
    setBusy(false);
    if (!response.ok) return setMessage(data.error || 'Could not save this campaign.');
    setMessage('Campaign saved. Opening the campaign editor...');
    router.push(`/dashboard/qr-codes/${data.id}`);
    router.refresh();
  }

  return (
    <div className="creator">
      <section className="card creator-form">
        <div className="sectionhead">
          <div><div className="eyebrow">Campaign builder</div><h2>Create a measurable QR channel</h2></div>
          <span className="pill">Dynamic</span>
        </div>
        <div className="formgrid">
          <label className="field">Campaign name<input className="input" value={name} maxLength={100} onChange={(event) => { setName(event.target.value); setSlug(slugify(event.target.value)); }} /></label>
          <label className="field">Business goal<select className="input" value={type} onChange={(event) => setType(event.target.value)}>{campaignTypes.map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
          <label className="field full">Destination URL<input className="input" type="url" value={url} onChange={(event) => setUrl(event.target.value)} /></label>
          <label className="field full">Permanent short link<span className="slugrow"><span>/r/</span><input className="input" value={slug} minLength={3} maxLength={50} onChange={(event) => setSlug(slugify(event.target.value))} /></span></label>
          {locations.length > 0 && <label className="field full">Location<select className="input" value={locationId} onChange={(event) => setLocationId(event.target.value)}><option value="">Workspace-wide campaign</option>{locations.map((location) => <option value={location.id} key={location.id}>{location.name}</option>)}</select></label>}
          <label className="field">Foreground<input className="colorinput" type="color" value={fg} onChange={(event) => setFg(event.target.value)} /></label>
          <label className="field">Background<input className="colorinput" type="color" value={bg} onChange={(event) => setBg(event.target.value)} /></label>
        </div>
        <div className="actions"><button className="btn" type="button" disabled={busy || slug.length < 3} onClick={save}>{busy ? 'Saving...' : 'Save campaign'}</button><button className="btn secondary" type="button" onClick={download}>Download preview</button></div>
        {message && <p className="notice" role="status">{message}</p>}
      </section>
      <aside className="card preview-panel">
        <span className="pill">Live preview</span>
        <div className="qrbox"><canvas ref={canvas} /></div>
        <code>{dynamicUrl}</code>
        <p className="muted small">The printed QR stays permanent. Change the destination later without replacing it.</p>
      </aside>
    </div>
  );
}
