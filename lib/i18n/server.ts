import { cookies, headers } from 'next/headers';
import type { Locale } from './config';
import { defaultLocale, qrCommandLocaleCookie, resolveLocaleForRequest } from './config';
import type { TranslationDictionary } from './translate';
import en from './dictionaries/en';
import { getLocaleContext, type LocaleContext } from './translate';

type DictionaryModule = { default: TranslationDictionary };

type DictionaryLoader = () => Promise<DictionaryModule>;

const dictionaries: Record<Locale, DictionaryLoader> = {
  en: () => import('./dictionaries/en'),
  es: () => import('./dictionaries/es'),
  fr: () => import('./dictionaries/fr'),
  de: () => import('./dictionaries/de'),
  pt: () => import('./dictionaries/pt'),
  it: () => import('./dictionaries/it'),
  ar: () => import('./dictionaries/ar'),
  hi: () => import('./dictionaries/hi'),
  zh: () => import('./dictionaries/zh'),
  ja: () => import('./dictionaries/ja'),
  ko: () => import('./dictionaries/ko'),
};

export async function getLocaleFromRequest() {
  let cookieLocale: string | null = null;
  let acceptLanguage: string | null = null;

  try {
    cookieLocale = (await cookies()).get(qrCommandLocaleCookie)?.value ?? null;
    acceptLanguage = (await headers()).get('accept-language');
  } catch {
    return resolveLocaleForRequest({});
  }

  return resolveLocaleForRequest({ localeCookie: cookieLocale, acceptLanguage });
}

export async function getDictionaryForLocale(locale: Locale): Promise<TranslationDictionary> {
  const normalized = dictionaries[locale] ? locale : defaultLocale;
  const dictionaryModule = await dictionaries[normalized]();
  return dictionaryModule.default;
}

export async function getLocalePayload() {
  const locale = await getLocaleFromRequest();
  const dictionary = await getDictionaryForLocale(locale);
  return { locale, dictionary, fallbackDictionary: en as TranslationDictionary };
}

export function getLocalePayloadSync() {
  const locale = resolveLocaleForRequest({});
  return { locale, dictionary: en as TranslationDictionary, fallbackDictionary: en as TranslationDictionary };
}

export function createServerLocaleContext(locale: Locale, dictionary: TranslationDictionary, fallback: TranslationDictionary = en): LocaleContext {
  return getLocaleContext(locale, dictionary, fallback);
}
