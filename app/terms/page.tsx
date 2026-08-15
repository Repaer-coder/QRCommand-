import type { Metadata } from 'next';
import React from 'react';
import LegalPageLayout from '@/components/legal-page-layout';
import { legalContact } from '@/lib/legal';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'Terms of Service for QR Command, including workspace eligibility, billing, usage rules, and liability language.',
};

const sections = [
  { id: 'acceptance', title: 'Acceptance of terms' },
  { id: 'eligibility', title: 'Eligibility and workspace setup' },
  { id: 'security', title: 'Account security and responsibility' },
  { id: 'service', title: 'Description of service' },
  { id: 'billing', title: 'Subscriptions and billing' },
  { id: 'content', title: 'Customer content and destination links' },
  { id: 'placement', title: 'QR placement and linked destinations' },
  { id: 'prohibited', title: 'Prohibited use' },
  { id: 'third-party', title: 'Third-party services and integrations' },
  { id: 'liability', title: 'Disclaimers and liability limits' },
  { id: 'termination', title: 'Suspension and termination' },
  { id: 'changes', title: 'Changes to terms' },
  { id: 'governing', title: 'Governing law' },
  { id: 'contact', title: 'Contact' },
];

export default async function TermsPage() {
  return await LegalPageLayout({
    title: 'Terms of Service',
    description: 'Welcome to QR Command. By accessing this platform you agree to these terms.',
    currentPath: '/terms',
    sections,
    children: (
      <>
        <section id="acceptance">
        <h2>Acceptance of terms</h2>
        <p>
          By creating or using a QR Command account, you agree to these Terms of Service and agree that the contract forms once you
          create your first workspace or use campaign and dashboard features.
        </p>
      </section>

      <section id="eligibility">
        <h2>Eligibility and workspace setup</h2>
        <p>QR Command is intended for lawful users and may be used by businesses and non-enterprise teams that can make valid contractual decisions.</p>
        <p>When you create an account you confirm that you can establish and operate a business workspace under your applicable law.</p>
      </section>

      <section id="security">
        <h2>Account security and responsibility</h2>
        <p>Each workspace member is responsible for protecting credentials and for all actions taken under their credentials.</p>
        <p>Use secure passwords, keep access to workspace devices secure, and notify support immediately if a login is lost or suspected compromised.</p>
      </section>

      <section id="service">
        <h2>Description of QR Command services</h2>
        <p>QR Command provides permanent campaign links, scan recording, dashboard analytics, location and team management, automations, blueprint workflows, and optional AI-assisted recommendations.</p>
        <p>Features and availability may evolve. Some functions require active plan entitlements and workspace roles.</p>
      </section>

      <section id="billing">
        <h2>Subscriptions and billing</h2>
        <ul>
          <li>Paid plans are billed on a recurring monthly basis through Stripe.</li>
          <li>Paid access is synchronized from your workspace&apos;s subscription status.</li>
          <li>Changes to pricing, taxes, discounts, and invoices are shown in secure checkout and the customer portal.</li>
          <li>Cancellation stops future renewal charges at period end unless prohibited by law.</li>
          <li>Stripe is used for payment collection and invoice management.</li>
        </ul>
      </section>

      <section id="content">
        <h2>Customer content and destination URLs</h2>
        <p>You retain ownership of your campaign names, destination URLs, locations, and business content.</p>
        <p>QR Command stores what is needed to serve dashboards and to provide scan analytics, and may process metadata about QR usage and destinations.</p>
      </section>

      <section id="placement">
        <h2>QR placement and linked destinations</h2>
        <p>You are responsible for legal permissions, print quality, placement safety, and destination accuracy for every QR deployed.</p>
        <p>QR Command does not control physical deployment contexts; those obligations remain with the customer.</p>
      </section>

      <section id="prohibited">
        <h2>Prohibited use</h2>
        <p>You may not use QR Command for fraud, malware, phishing, deceptive redirects, unlawful traffic generation, rights violations, privacy abuse, or any activity that circumvents plan, security, or workspace controls.</p>
      </section>

      <section id="third-party">
        <h2>Third-party services and integrations</h2>
        <p>QR Command links to services including Supabase, Stripe, and Vercel for platform operation, and optional integrations are controlled by workspace permissions.</p>
        <p>These services are governed by their own terms. We are not responsible for downtime or defects caused outside QR Command operational control.</p>
      </section>

      <section id="liability">
        <h2>Disclaimers and liability limits</h2>
        <p>QR Command is provided as-is. While we follow secure engineering practices, service performance can vary by dependency, browser, network, and client infrastructure.</p>
        <p>To the fullest extent permitted by law, QR Command&apos;s liability is limited to fees paid for the preceding billing period, and is otherwise disclaimed for indirect or consequential losses.</p>
        <p>Customers indemnify QR Command for claims arising from illegal campaign content, misuse of data, or unauthorised access by user teams.</p>
      </section>

      <section id="termination">
        <h2>Suspension, termination, and governing terms</h2>
        <p>We may suspend or terminate accounts for violations, abuse, or unresolved account security incidents.</p>
        <p>Service availability may change as needed for reliability, security, and supportability. Substantial plan or term updates will be published here.</p>
      </section>

      <section id="changes">
        <h2>Changes to terms</h2>
        <p>We may update these terms as laws or product operations evolve. We will post updates in this document with a revised effective date.</p>
      </section>

      <section id="contact">
        <h2>Contact</h2>
        <p>For account or legal questions, contact {legalContact.supportEmail}.</p>
      </section>

      <section id="governing">
        <h2>Governing law</h2>
        <p>These terms are governed by the laws of the State of {legalContact.governingState}, in the {legalContact.governingCountry}.</p>
        <p>For billing and legal notices in this contract, use the email above.</p>
      </section>
      </>
    ),
  });
}
