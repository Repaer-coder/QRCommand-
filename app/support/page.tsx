import type { Metadata } from 'next';
import React from 'react';
import Link from 'next/link';
import LegalPageLayout from '@/components/legal-page-layout';
import { legalContact } from '@/lib/legal';

export const metadata: Metadata = {
  title: 'Support and Contact',
  description: 'Customer support contact details and request guidance for QR Command.',
};

const sections = [
  { id: 'help', title: 'Support channels' },
  { id: 'billing', title: 'Billing requests' },
  { id: 'privacy', title: 'Privacy requests' },
  { id: 'abuse', title: 'Abuse reports' },
];

export default function SupportPage() {
  return (
    <LegalPageLayout
      title="Support and Contact"
      description="Reach the QR Command team for support requests and operational help."
      currentPath="/support"
      sections={sections}
    >
      <section id="help">
        <h2>Support contact</h2>
        <p>
          Operator: <strong>{legalContact.operator}</strong>
        </p>
        <p>
          Support email:{' '}
          <Link href={`mailto:${legalContact.supportEmail}`}>{legalContact.supportEmail}</Link>
        </p>
        <p>
          Jurisdiction: {legalContact.governingState}, {legalContact.governingCountry}
        </p>
        <p>
          For all requests, include account email, workspace name, campaign name, approximate time, and any useful screenshot links.
        </p>
      </section>

      <section id="billing">
        <h2>Billing questions</h2>
        <p>For subscription status, invoice access, and cancellation requests, visit Billing in your dashboard and use the Stripe customer portal.</p>
      </section>

      <section id="privacy">
        <h2>Privacy requests</h2>
        <p>For account deletion, access, correction, or data correction requests, email our support team with workspace details.</p>
      </section>

      <section id="abuse">
        <h2>Abuse reports</h2>
        <p>Report fraudulent links, unauthorized access, or abuse patterns to support with clear dates and affected workspace context.</p>
        <p>Expected response times vary by issue complexity and team availability.</p>
        <p>Please do not send passwords, API keys, signing secrets, full card numbers, or sensitive secrets in email messages.</p>
      </section>
    </LegalPageLayout>
  );
}
