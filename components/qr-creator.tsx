'use client';

import QRCode from 'qrcode';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useI18n } from '@/components/i18n-provider';
import { useRouter } from 'next/navigation';

type CampaignType = {
  value: string;
  labelKey: string;
};

const campaignTypes: CampaignType[] = [
  { value: 'restaurant', labelKey: 'qr.builder.goalRestaurant' },
  { value: 'reviews', labelKey: 'qr.builder.goalReviews' },
  { value: 'social', labelKey: 'qr.builder.goalSocial' },
  { value: 'website', labelKey: 'qr.builder.goalWebsite' },
  { value: 'lead', labelKey: 'qr.builder.goalLead' },
  { value: 'coupon', labelKey: 'qr.builder.goalCoupon' },
  { value: 'event', labelKey: 'qr.builder.goalEvent' },
  { value: 'wifi', labelKey: 'qr.builder.goalWifi' },
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
  const { t } = useI18n();
  const router = useRouter();
  const canvas = useRef<HTMLCanvasElement>(null);
  const [name, setName] = useState('My first campaign');
  const [type, setType] = useState(campaignTypes.some(({ value }) => value === initialType) ? initialType : 'website');
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
    setMessage(t('qr.actions.saving'));
    const response = await fetch('/api/qr', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name, type, destinationUrl: url, slug, style: { fg, bg }, locationId: locationId || null }),
    });
    const data = await response.json().catch(() => ({}));
    setBusy(false);
    if (!response.ok) return setMessage(data.error || t('qr.builder.saveFailure'));
    setMessage(t('qr.builder.saveSuccess'));
    router.push(`/dashboard/qr-codes/${data.id}`);
    router.refresh();
  }

  return (
    <div className="creator">
      <section className="card creator-form">
        <div className="sectionhead">
          <div>
            <div className="eyebrow">{t('qr.builder.title')}</div>
            <h2>{t('qr.builder.dynamicCampaign')}</h2>
          </div>
          <span className="pill">{t('qr.builder.dynamicCampaign')}</span>
        </div>
        <div className="formgrid">
          <label className="field">
            {t('qr.builder.campaignLabel')}
            <input
              className="input"
              value={name}
              maxLength={100}
              onChange={(event) => {
                setName(event.target.value);
                setSlug(slugify(event.target.value));
              }}
            />
          </label>
          <label className="field">
            {t('qr.builder.businessGoal')}
            <select className="input" value={type} onChange={(event) => setType(event.target.value)}>
              {campaignTypes.map(({ value, labelKey }) => (
                <option key={value} value={value}>
                  {t(labelKey)}
                </option>
              ))}
            </select>
          </label>
          <label className="field full">
            {t('qr.builder.destinationUrl')}
            <input className="input" type="url" value={url} onChange={(event) => setUrl(event.target.value)} />
          </label>
          <label className="field full">
            {t('qr.library.permanentLink')}
            <span className="slugrow"><span>/r/</span><input className="input" value={slug} minLength={3} maxLength={50} onChange={(event) => setSlug(slugify(event.target.value))} /></span>
          </label>
          {locations.length > 0 && <label className="field full">
            {t('qr.builder.locationTitle')}
            <select className="input" value={locationId} onChange={(event) => setLocationId(event.target.value)}>
              <option value="">{t('qr.builder.workspaceWide')}</option>
              {locations.map((location) => <option value={location.id} key={location.id}>{location.name}</option>)}
            </select>
          </label>}
          <label className="field">
            {t('qr.builder.foreground')}
            <input className="colorinput" type="color" value={fg} onChange={(event) => setFg(event.target.value)} />
          </label>
          <label className="field">
            {t('qr.builder.background')}
            <input className="colorinput" type="color" value={bg} onChange={(event) => setBg(event.target.value)} />
          </label>
        </div>
        <div className="actions">
          <button className="btn" type="button" disabled={busy || slug.length < 3} onClick={save}>
            {busy ? t('qr.builder.saving') : t('qr.builder.saveCampaign')}
          </button>
          <button className="btn secondary" type="button" onClick={download}>
            {t('qr.builder.download')}
          </button>
        </div>
        {message && <p className="notice" role="status">{message}</p>}
      </section>
      <aside className="card preview-panel">
        <span className="pill">{t('qr.builder.dynamicCampaign')}</span>
        <div className="qrbox"><canvas ref={canvas} /></div>
        <div style={{ width: '100%', display: 'grid', gap: '8px', textAlign: 'left' }}>
          <span className="muted small">{t('qr.qrToLabel')}</span>
          <a className="codeurl" href={dynamicUrl} target="_blank" rel="noopener noreferrer">
            {dynamicUrl}
          </a>
          <span className="muted small">{t('qr.redirectsToLabel')}</span>
          <code>{url || t('qr.noDestination')}</code>
        </div>
        <p className="muted small">{t('qr.permanentMessage')}</p>
      </aside>
    </div>
  );
}
