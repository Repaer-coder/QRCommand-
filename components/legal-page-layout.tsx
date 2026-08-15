import React, { type ReactNode } from 'react';
import { legalContact, legalNotice } from '@/lib/legal';
import { createServerLocaleContext, getLocalePayload } from '@/lib/i18n/server';

type SectionLink = { id: string; title: string };

type LegalPageLayoutProps = {
  title: string;
  description: string;
  currentPath: string;
  sections?: SectionLink[];
  children: ReactNode;
};

export default async function LegalPageLayout({ title, description, sections = [], currentPath, children }: LegalPageLayoutProps) {
  const { locale, dictionary } = await getLocalePayload();
  const { t } = createServerLocaleContext(locale, dictionary);

  return (
    <main className="legal-page">
      <div className="container legal-page-shell">
        <article className="legal-page-card card">
          <header className="legal-page-head">
            <p className="eyebrow">{t('legal.heading')}</p>
            <h1>{title}</h1>
            <p className="muted legal-page-description">{description}</p>
            <p className="legal-meta">Effective date: <strong>{legalContact.effectiveDate}</strong>.</p>
          </header>

          <div className="legal-page-layout">
            {sections.length > 0 ? (
              <>
                <aside className="legal-toc" aria-label="Table of contents">
                  <h2>{t('legalPages.heading.sections.sections')}</h2>
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

          <p className="legal-notice">
            {legalNotice}
            {' '}
            <a href={currentPath}>{t('generic.viewEnglish')}</a>
          </p>
        </article>
      </div>
    </main>
  );
}
