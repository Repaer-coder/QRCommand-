import Link from 'next/link';
import { legalPolicyLinks } from '@/lib/legal';
import React from 'react';

type LegalLinksProps = {
  compact?: boolean;
};

export default function LegalLinks({ compact = false }: LegalLinksProps) {
  if (compact) {
    return (
      <nav className="legal-links legal-links-compact" aria-label="Legal and support links">
        <Link href="/support" className="mini">
          Legal &amp; Support
        </Link>
      </nav>
    );
  }

  return (
    <nav className="legal-links" aria-label="Legal and support links">
      <ul>
        {legalPolicyLinks.map((link) => (
          <li key={link.href}>
            <Link href={link.href}>{link.label}</Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
