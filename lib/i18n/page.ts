import { createServerLocaleContext, getLocalePayload } from './server';
import type { LocaleContext } from './translate';

export async function getServerI18n(): Promise<LocaleContext> {
  const { locale, dictionary } = await getLocalePayload();
  return createServerLocaleContext(locale, dictionary);
}
