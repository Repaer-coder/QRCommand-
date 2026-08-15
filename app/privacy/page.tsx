import type { Metadata } from 'next';
import React from 'react';
import LegalPageLayout from '@/components/legal-page-layout';
import { legalContact } from '@/lib/legal';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Privacy policy describing the categories of data we process in QR Command and how that information is used and retained.',
};

const sections = [
  { id: 'overview', title: 'Data categories' },
  { id: 'purposes', title: 'How we use information' },
  { id: 'providers', title: 'Service providers and processors' },
  { id: 'analytics', title: 'Scan analytics and session data' },
  { id: 'security', title: 'Security and retention' },
  { id: 'rights', title: 'User choices and rights' },
  { id: 'children', title: 'Children&apos;s privacy' },
  { id: 'cross-border', title: 'International processing' },
  { id: 'changes', title: 'Policy changes' },
  { id: 'contact', title: 'Contact' },
  { id: 'governing', title: 'Governing law' },
];

export default function PrivacyPage() {
  return (
    <LegalPageLayout
      title="Privacy Policy"
      description="How QR Command handles account, workspace, and scan information."
      currentPath="/privacy"
      sections={sections}
    >
      <section id="overview">
        <h2>Data categories</h2>
        <p>We process account data, workspace metadata, campaign records, destinations, scan events, and support/administrative records.</p>
        <ul>
          <li>Account and authentication details: email, secure authentication credentials handled by Supabase Auth.</li>
          <li>Workspace and business profile: workspace names, locations, roles, invites, and plan state.</li>
          <li>Campaign data: campaign names, short links, destination URLs, QR configuration, status, and edit history.</li>
          <li>Scan and analytics signals: scan time, destination, browser/user-agent signals, referrer data where available, and approximate location.</li>
          <li>Device and platform context used for security and reliability monitoring.</li>
          <li>Subscriptions: customer identifiers and billing status from Stripe.</li>
          <li>Team and collaboration: invites, roles, audit trails, and approvals.</li>
          <li>Integrations and webhook metadata: encrypted secrets and endpoint status.</li>
          <li>AI usage: prompts, outputs, drafts, recommendations, and approval outcomes where AI features are used.</li>
        </ul>
      </section>

      <section id="purposes">
        <h2>How we use information</h2>
        <ul>
          <li>Authenticate and secure access to your workspace.</li>
          <li>Deliver QR generation, redirection, scans, and dashboard analytics.</li>
          <li>Run role-based controls, plan enforcement, and entitlement checks.</li>
          <li>Deliver support, security monitoring, abuse detection, and incident response.</li>
          <li>Provide optional AI insights from your workspace data and record recommendation history.</li>
        </ul>
      </section>

      <section id="providers">
        <h2>Service providers and processors</h2>
        <p>We use these providers only for platform operation:</p>
        <ul>
          <li>Supabase for database storage and authentication.</li>
          <li>Stripe for payment collection and subscription management.</li>
          <li>Vercel for application hosting.</li>
          <li>OpenAI for AI recommendation generation where enabled.</li>
        </ul>
      </section>

      <section id="analytics">
        <h2>Scan analytics and session data</h2>
        <p>Scan events are used for operational analytics and campaign reporting. We process IP-derived information to support anti-abuse and regional reporting and do not falsely claim that raw IP addresses are always stored permanently; where hashed values are present, they are used for anti-abuse and security context.</p>
        <p>Device, browser, and referrer indicators may be stored when available and relevant to scan analysis.</p>
      </section>

      <section id="security">
        <h2>Security and retention</h2>
        <p>We use role-based access controls, audit logging, and server-side key handling.</p>
        <p>Retention follows operational needs and legal requirements; paid account and workspace records are retained while a workspace exists and may remain in backup or compliance systems for a defined period.</p>
      </section>

      <section id="rights">
        <h2>User choices and rights</h2>
        <p>Contact support to request access summaries, account data corrections, or deletion requests. Some records may remain where required by legal or operational policy.</p>
        <p>You can review and manage workspace users, connected integrations, destinations, and consent at any time.</p>
      </section>

      <section id="children">
        <h2>Children&apos;s privacy</h2>
        <p>QR Command is not directed to children under 13.</p>
      </section>

      <section id="cross-border">
        <h2>International processing</h2>
        <p>Data may be processed in the United States and through cross-border infrastructure for reliable platform delivery. By using the service you consent to this processing model.</p>
      </section>

      <section id="changes">
        <h2>Policy changes</h2>
        <p>This policy may be updated when processing or legal needs change. Updated versions are published on this page and become effective on the date listed.</p>
      </section>

      <section id="contact">
        <h2>Contact</h2>
        <p>Questions or concerns about privacy practices: {legalContact.supportEmail}.</p>
      </section>

      <section id="governing">
        <h2>Governing law</h2>
        <p>Florida law applies, and disputes are subject to the legal framework of the {legalContact.governingCountry}.</p>
      </section>
    </LegalPageLayout>
  );
}
