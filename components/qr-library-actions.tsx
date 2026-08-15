'use client';

import QRCode from 'qrcode';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/components/i18n-provider';

export default function QRLibraryActions({
  id,
  slug,
  name,
  status,
  style,
  canDelete,
}: {
  id: string;
  slug: string;
  name: string;
  status: string;
  style?: { fg?: string; bg?: string } | null;
  canDelete: boolean;
}) {
  const router = useRouter();
  const { t } = useI18n();
  const shortLink = useMemo(() => (typeof window === 'undefined' ? `/r/${slug}` : `${window.location.origin}/r/${slug}`), [slug]);
  const [qrImage, setQrImage] = useState('');
  const [busy, setBusy] = useState(false);
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
    if (!response.ok) return window.alert(body.error || t('qr.actions.updateMessage'));
    router.refresh();
  }

  async function remove() {
    if (!window.confirm(t('qr.actions.confirmDelete').replace('{name}', name))) return;
    setBusy(true);
    const response = await fetch(`/api/qr/${id}`, { method: 'DELETE' });
    const body = await response.json().catch(() => ({}));
    setBusy(false);
    if (!response.ok) return window.alert(body.error || t('qr.actions.deleteMessage'));
    router.refresh();
  }

  const nextStatus = status === 'active' ? 'paused' : 'active';

  return (
    <div className="qr-library-actions">
      <a className="qr-library-link codeurl" href={shortLink} target="_blank" rel="noopener noreferrer">
        {shortLink}
      </a>
      {qrImage ? (
        <div className="qr-library-preview">
          <a href={shortLink} target="_blank" rel="noopener noreferrer" className="qr-library-preview-link">
            <img alt={`Permanent QR for ${slug}`} src={qrImage} className="qr-library-preview-image" />
          </a>
        </div>
      ) : (
        <div className="qr-library-preview qr-library-preview-loading">
          <small className="muted">{t('qr.actions.generatingQr')}</small>
        </div>
      )}
      <div className="qr-library-primary-actions">
        <a className="mini" href={shortLink} target="_blank" rel="noopener noreferrer">
          {t('qr.actions.test')}
        </a>
        <button className="mini" type="button" onClick={download}>
          {t('qr.actions.download')}
        </button>
      </div>
      <div className="qr-library-management-actions">
        <a className="mini" href={`/dashboard/qr-codes/${id}`}>
          {t('qr.actions.edit')}
        </a>
        <button className="mini" type="button" disabled={busy} onClick={() => update({ status: nextStatus })}>
          {status === 'active' ? t('qr.actions.togglePause') : t('qr.actions.toggleActivate')}
        </button>
        <button
          className="mini danger"
          type="button"
          disabled={busy}
          onClick={() => (canDelete ? remove() : update({ status: 'archived' }))}
        >
          {canDelete ? t('qr.actions.delete') : t('qr.actions.archive')}
        </button>
      </div>
    </div>
  );
}
