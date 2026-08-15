import type { Metadata } from 'next';
import './globals.css';
import SiteNav from '@/components/site-nav';
import I18nProvider from '@/components/i18n-provider';
import { createServerLocaleContext, getLocalePayload } from '@/lib/i18n/server';
import { localeDirections } from '@/lib/i18n/config';

export async function generateMetadata(): Promise<Metadata> {
  const { locale, dictionary } = await getLocalePayload();
  const { t } = createServerLocaleContext(locale, dictionary);

  return {
    title: {
      default: t('metadata.title'),
      template: `%s | ${t('metadata.title')}`,
    },
    description: t('metadata.description'),
  };
}

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const payload = await getLocalePayload();

  return (
    <html lang={payload.locale} dir={localeDirections[payload.locale] ?? 'ltr'}>
      <body>
        <I18nProvider locale={payload.locale} dictionary={payload.dictionary}>
          <SiteNav />
          {children}
        </I18nProvider>
      </body>
    </html>
  );
}
