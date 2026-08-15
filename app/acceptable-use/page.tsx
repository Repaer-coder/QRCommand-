import type { Metadata } from 'next';
import React from 'react';
import LegalPageLayout from '@/components/legal-page-layout';

export const metadata: Metadata = {
  title: 'Acceptable Use Policy',
  description: 'Acceptable-use rules for QR Command use, including prohibited conduct, fraud prevention, and abuse reporting.',
};

const sections = [
  { id: 'overview', title: 'Purpose and scope' },
  { id: 'prohibited', title: 'Prohibited conduct' },
  { id: 'abuse', title: 'Abuse reporting and response' },
  { id: 'contact', title: 'Contact' },
];

export default function AcceptableUsePage() {
  return (
    <LegalPageLayout
      title="Acceptable Use Policy"
      description="Use these policies to protect customers, maintain safe operations, and avoid misuse of workspace tooling."
      currentPath="/acceptable-use"
      sections={sections}
    >
      <section id="overview">
        <h2>Purpose and scope</h2>
        <p>This policy applies to all users, API keys, integrations, automations, campaigns, and teams within QR Command.</p>
        <p>Users must follow this policy while using QR links, campaigns, scans, automations, and workspace controls.</p>
      </section>

      <section id="prohibited">
        <h2>Prohibited conduct</h2>
        <ul>
          <li>Unlawful activity or distribution of illegal content.</li>
          <li>Phishing, credential theft, malware distribution, or deceptive redirects.</li>
          <li>Impersonation, fraud, or publication of content you do not have rights to distribute.</li>
          <li>Privacy abuse, secret tracking, or unauthorized data collection.</li>
          <li>Spam, abusive marketing, harassment, or exploitative content.</li>
          <li>Attempting to bypass plan, billing, security, rate-limit, or workspace-isolation controls.</li>
          <li>Use of automations/integrations to perform unauthorized actions.</li>
          <li>Any action intended to harm QR Command services or dependent infrastructure.</li>
        </ul>
      </section>

      <section id="abuse">
        <h2>Abuse reporting and response</h2>
        <p>We may suspend or remove content, remove integrations, or restrict workspace access to prevent harm and protect other customers.</p>
        <p>Repeat violations can result in cancellation and permanent access removal depending on severity.</p>
      </section>

      <section id="contact">
        <h2>Contact</h2>
        <p>Report abuse or policy questions by contacting support from the Support and Contact page.</p>
      </section>
    </LegalPageLayout>
  );
}
