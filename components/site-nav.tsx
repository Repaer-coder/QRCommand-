'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useI18n } from '@/components/i18n-provider';
import LocaleSelector from '@/components/locale-selector';

export default function SiteNav() {
  const { t } = useI18n();
  const pathname = usePathname();

  if (pathname.startsWith('/dashboard') || pathname === '/onboarding') return null;

  return (
    <nav className="nav" aria-label={t('navigation.public')}>
      <div className="container navin">
        <Link className="logo" href="/">
          QR<span>Command</span>
        </Link>
        <div className="links">
          <Link href="/#platform">{t('navigation.platform')}</Link>
          <Link href="/#systems">{t('navigation.systems')}</Link>
          <Link href="/pricing">{t('navigation.pricing')}</Link>
          <Link href="/login">{t('navigation.signIn')}</Link>
          <Link className="btn" href="/login?mode=signup">
            {t('navigation.startBuilding')}
          </Link>
          <LocaleSelector compact />
        </div>
      </div>
    </nav>
  );
}
