import type { Metadata } from 'next';
import React from 'react';
import Link from 'next/link';
import LegalPageLayout from '@/components/legal-page-layout';
import { legalContact } from '@/lib/legal';

export const metadata: Metadata = {
  title: 'Subscription Cancellation and Refund Policy',
  description: 'Plain-language explanation of cancellation, renewals, and our non-refund policy for QR Command subscriptions.',
};

const sections = [
  { id: 'overview', title: 'Cancellation policy overview' },
  { id: 'no-refund', title: 'Non-refundable policy' },
  { id: 'end-date', title: 'Ending and access timing' },
  { id: 'violations', title: 'Suspensions and violations' },
  { id: 'billing', title: 'Billing support requests' },
  { id: 'contact', title: 'Contact and records' },
];

export default function RefundPolicyPage() {
  return (
    <LegalPageLayout
      title="Subscription Cancellation and Refund Policy"
      description="Cancellation and refund terms for paid QR Command subscriptions."
      sections={sections}
    >
      <section id="overview">
        <h2>Cancellation overview</h2>
        <p>All paid subscriptions are recurring and synchronized to Stripe. You can cancel at any time from QR Command Billing via the Manage Subscription button.</p>
      </section>

      <section id="no-refund">
        <h2>Non-refundable policy</h2>
        <p>Payments are non-refundable except where required by applicable law.</p>
        <p>Cancellation prevents future renewal charges but does not retroactively refund fees already paid.</p>
      </section>

      <section id="end-date">
        <h2>Ending and access timing</h2>
        <p>When canceled for period end, your workspace typically keeps paid access through the current billing period end date.</p>
        <p>Access does not retroactively unlock additional billing credits after cancellation.</p>
      </section>

      <section id="violations">
        <h2>Suspensions and policy violations</h2>
        <p>If your workspace is terminated for policy violations, no refund is automatically created unless required by law.</p>
      </section>

      <section id="billing">
        <h2>Billing support requests</h2>
        <p>If you suspect duplicate, unusual, or unauthorized charges, report them promptly to {legalContact.supportEmail}.</p>
      </section>

      <section id="contact">
        <h2>Transaction records</h2>
        <p>Billing transaction history is maintained in Stripe and can be accessed through your customer portal in QR Command billing settings.</p>
        <p>
          In-app path for support: <Link href="/dashboard/billing">Open billing</Link>.
        </p>
        <p>
          Governing law remains with the Florida, United States jurisdictions listed in our Terms of Service.
        </p>
      </section>
    </LegalPageLayout>
  );
}
