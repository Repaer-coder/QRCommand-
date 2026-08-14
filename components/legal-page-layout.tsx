import React, { type ReactNode } from 'react';
import { legalContact, legalNotice } from '@/lib/legal';

type SectionLink = { id: string; title: string };

type LegalPageLayoutProps = {
  title: string;
  description: string;
  sections?: SectionLink[];
  children: ReactNode;
};

export default function LegalPageLayout({ title, description, sections = [], children }: LegalPageLayoutProps) {
  return (
    <main className="legal-page">
      <div className="container legal-page-shell">
        <article className="legal-page-card card">
          <header className="legal-page-head">
            <p className="eyebrow">Legal policies</p>
            <h1>{title}</h1>
            <p className="muted legal-page-description">{description}</p>
            <p className="legal-meta">Effective date: <strong>{legalContact.effectiveDate}</strong>.</p>
          </header>

          <div className="legal-page-layout">
            {sections.length > 0 ? (
              <>
                <aside className="legal-toc" aria-label="Table of contents">
                  <h2>Contents</h2>
                  <ol>
                    {sections.map((section) => (
                      <li key={section.id}>
                        <a href={`#${section.id}`}>{section.title}</a>
                      </li>
                    ))}
                  </ol>
                </aside>
                <div className="legal-content">
                  {children}
                </div>
              </>
            ) : (
              <div className="legal-content">{children}</div>
            )}
          </div>

          <p className="legal-notice">{legalNotice}</p>
        </article>
      </div>
    </main>
  );
}
