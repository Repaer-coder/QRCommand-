export const supportedLocales = ['en', 'es', 'fr', 'de', 'pt', 'it', 'ar', 'hi', 'zh', 'ja', 'ko'] as const;

export type Locale = (typeof supportedLocales)[number];

export const defaultLocale: Locale = 'en';

export const qrCommandLocaleCookie = 'qr-command-locale';

export const localeNames: Record<Locale, string> = {
  en: 'English',
  es: 'Español',
  fr: 'Français',
  de: 'Deutsch',
  pt: 'Português',
  it: 'Italiano',
  ar: 'العربية',
  hi: 'हिन्दी',
  zh: '简体中文',
  ja: '日本語',
  ko: '한국어',
};

export const localeDirections: Record<Locale, 'ltr' | 'rtl'> = {
  en: 'ltr',
  es: 'ltr',
  fr: 'ltr',
  pt: 'ltr',
  it: 'ltr',
  de: 'ltr',
  ar: 'rtl',
  hi: 'ltr',
  zh: 'ltr',
  ja: 'ltr',
  ko: 'ltr',
};

const regionalFallbacks: Record<string, Locale> = {
  'en-us': 'en',
  'en-gb': 'en',
  'en-au': 'en',
  'es-mx': 'es',
  'es-es': 'es',
  'es-419': 'es',
  'pt-br': 'pt',
  'pt-pt': 'pt',
  'fr-ca': 'fr',
  'fr-fr': 'fr',
  'de-de': 'de',
  'it-it': 'it',
  'zh-cn': 'zh',
  'zh-tw': 'zh',
  'zh-hans': 'zh',
  'ja-jp': 'ja',
  'ko-kr': 'ko',
  'hi-in': 'hi',
};

export function normalizeLocale(raw: string | undefined | null): Locale | undefined {
  if (!raw) return undefined;

  const lowered = raw.trim().toLowerCase();

  if (supportedLocales.includes(lowered as Locale)) {
    return lowered as Locale;
  }

  if (regionalFallbacks[lowered]) return regionalFallbacks[lowered];

  const base = lowered.split('-')[0];
  if (regionalFallbacks[base]) return regionalFallbacks[base];
  if (supportedLocales.includes(base as Locale)) return base as Locale;

  return undefined;
}

export function resolveLocaleFromAcceptLanguage(header: string | null): Locale {
  if (!header) return defaultLocale;

  const candidates = header
    .split(',')
    .map((entry) => entry.trim())
    .map((entry) => {
      const [localeRaw, ...rest] = entry.split(';');
      const qRaw = rest.find((candidate) => candidate.toLowerCase().startsWith('q='));
      const quality = qRaw ? Number.parseFloat(qRaw.substring(2)) : 1;
      return { locale: (localeRaw ?? '').trim().toLowerCase(), quality: Number.isFinite(quality) ? quality : 0 };
    })
    .filter((item) => item.locale.length > 0)
    .sort((a, b) => b.quality - a.quality);

  for (const item of candidates) {
    const normalized = normalizeLocale(item.locale);
    if (normalized) return normalized;
  }

  return defaultLocale;
}

export function resolveLocaleForRequest(opts: { localeCookie?: string | null; acceptLanguage?: string | null }): Locale {
  const fromCookie = normalizeLocale(opts.localeCookie);
  if (fromCookie) return fromCookie;
  return resolveLocaleFromAcceptLanguage(opts.acceptLanguage ?? null);
}
