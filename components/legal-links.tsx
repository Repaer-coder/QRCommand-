'use client';

import React from 'react';
import { useI18n } from '@/components/i18n-provider';
import Link from 'next/link';
import { legalPolicyLinks } from '@/lib/legal';
import LocaleSelector from '@/components/locale-selector';

type LegalLinksProps = {
  compact?: boolean;
};

function getLegalLabel(label: string, t: (key: string) => string) {
  switch (label) {
    case 'Terms of Service':
      return t('legalPages.terms.title') || label;
    case 'Privacy Policy':
      return t('legalPages.privacy.title') || label;
    case 'Refunds & Cancellation':
      return t('legalPages.refund.title') || label;
    case 'Acceptable Use':
      return t('legalPages.acceptableUse.title') || label;
    case 'Support':
      return t('legalPages.support.title') || label;
    default:
      return label;
  }
}

export default function LegalLinks({ compact = false }: LegalLinksProps) {
  const { t } = useI18n();

  if (compact) {
    return (
      <nav className="legal-links legal-links-compact" aria-label={t('legalLinks.legalAndSupport')}>
        <Link className="mini" href="/support">
          {t('legalLinks.label')}
        </Link>
        <LocaleSelector compact />
      </nav>
    );
  }

  return (
    <nav className="legal-links" aria-label={t('legalLinks.legalAndSupport')}>
      <ul>
        {legalPolicyLinks.map((link) => (
          <li key={link.href}>
            <Link href={link.href}>{getLegalLabel(link.label, t)}</Link>
          </li>
        ))}
      </ul>
      <LocaleSelector compact />
    </nav>
  );
}
