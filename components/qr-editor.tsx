'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import QRCode from 'qrcode';
import { useI18n } from '@/components/i18n-provider';

export default function QREditor({
  code,
  locations,
}: {
  code: { id: string; name: string; destination_url: string; status: string; slug: string; location_id: string | null; style: { fg?: string; bg?: string } | null };
  locations: { id: string; name: string }[];
}) {
  const router = useRouter();
  const { t } = useI18n();
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
    setMessage(t('common.saving'));
    const response = await fetch(`/api/qr/${code.id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name, destination_url: destinationUrl, status, location_id: locationId || null, style: { fg, bg } }),
    });
    const body = await response.json().catch(() => ({}));
    setBusy(false);
    setMessage(response.ok ? t('qr.library.messageSave') : body.error || t('qr.actions.updateMessage'));
    if (response.ok) router.refresh();
  }

  function formatStatus(value: string) {
    if (value === 'active') return t('dashboard.qrLibrary.active');
    if (value === 'paused') return t('dashboard.qrLibrary.paused');
    return value;
  }

  return (
    <section className="card editcard">
      <div className="sectionhead"><div><div className="eyebrow">{t('qr.library.qrPreviewTitle')}</div><h2>{code.name}</h2></div><span className={`status ${status}`}>{formatStatus(status)}</span></div>
      <div className="formgrid">
        <label className="field">{t('qr.builder.campaignLabel')}<input className="input" value={name} onChange={(event) => setName(event.target.value)} /></label>
        <label className="field">{t('common.status')}<select className="input" value={status} onChange={(event) => setStatus(event.target.value)}><option value="active">{t('dashboard.qrLibrary.active')}</option><option value="paused">{t('dashboard.qrLibrary.paused')}</option></select></label>
        <label className="field full">{t('qr.builder.destinationUrl')}<input className="input" type="url" value={destinationUrl} onChange={(event) => setDestinationUrl(event.target.value)} /></label>
        <label className="field full">{t('qr.builder.locationTitle')}<select className="input" value={locationId} onChange={(event) => setLocationId(event.target.value)}><option value="">{t('qr.builder.workspaceWide')}</option>{locations.map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}</select></label>
        <label className="field">{t('qr.builder.foreground')}<input className="colorinput" type="color" value={fg} onChange={(event) => setFg(event.target.value)} /></label>
        <label className="field">{t('qr.builder.background')}<input className="colorinput" type="color" value={bg} onChange={(event) => setBg(event.target.value)} /></label>
        <div className="field full">
          <span>{t('qr.library.permanentLink')}</span>
          <a className="codeurl" href={shortLink} target="_blank" rel="noopener noreferrer">
            {shortLink}
          </a>
        </div>
      </div>
      <div className="preview-panel">
        <span className="pill">{t('qr.qrPreview')}</span>
        {qrImage ? (
          <a href={shortLink} target="_blank" rel="noopener noreferrer">
            <img
              alt={`${t('qr.library.qrPreview')}: ${code.slug}`}
              src={qrImage}
              width={280}
              height={280}
              style={{ background: '#ffffff', borderRadius: '14px', padding: '8px', border: '1px solid var(--line)' }}
            />
          </a>
        ) : (
          <div className="qrbox">
            <small className="muted">{t('qr.actions.generatingQr')}</small>
          </div>
        )}
        <div className="actions">
          <a className="btn secondary" href={shortLink} target="_blank" rel="noopener noreferrer">
            {t('qr.actions.test')}
          </a>
          <button className="btn" type="button" onClick={downloadQr}>
            {t('qr.actions.download')}
          </button>
        </div>
      </div>
      <div className="actions"><button className="btn" type="button" disabled={busy} onClick={save}>{busy ? t('common.saving') : t('qr.actions.updateMessage') === 'Could not update this campaign.' ? t('qr.library.saveChanges') : t('qr.library.saveChanges')}</button><Link className="btn secondary" href="/dashboard/qr-codes">{t('dashboard.qrLibrary.openLibrary')}</Link></div>
      {message && <p className="notice" role="status">{message}</p>}
    </section>
  );
}
