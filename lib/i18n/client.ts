import type { Locale } from './config';
import { localeDirections, localeNames, qrCommandLocaleCookie, supportedLocales } from './config';

export type BrowserLocaleState = {
  locale: Locale;
  rawCookie: string | null;
  hasExplicitPreference: boolean;
};

function parseBrowserCookies(cookieString: string | undefined) {
  return cookieString
    ? cookieString.split(';').map((segment) => segment.trim()).filter(Boolean)
    : [];
}

export function getLocaleCookieValue(cookieHeader?: string): string | null {
  const cookie = (cookieHeader ?? (typeof document === 'undefined' ? '' : document.cookie)) || '';
  const cookieEntries = parseBrowserCookies(cookie);
  for (const entry of cookieEntries) {
    const [name, ...rest] = entry.split('=');
    if (name === qrCommandLocaleCookie) {
      return decodeURIComponent(rest.join('=')); // safe if value has encoded punctuation
    }
  }
  return null;
}

export function getLocaleFromCookie(cookieHeader?: string): BrowserLocaleState {
  const value = getLocaleCookieValue(cookieHeader);
  if (!value) return { locale: 'en', rawCookie: null, hasExplicitPreference: false };

  const normalized = value.trim().toLowerCase();
  if ((supportedLocales as readonly string[]).includes(normalized)) {
    return { locale: normalized as Locale, rawCookie: value, hasExplicitPreference: true };
  }

  return { locale: 'en', rawCookie: value, hasExplicitPreference: false };
}

export function getBrowserLocaleFromCookie(): BrowserLocaleState {
  const value = getLocaleCookieValue();
  if (!value) return { locale: 'en', rawCookie: null, hasExplicitPreference: false };

  const normalized = value.trim().toLowerCase();
  if ((supportedLocales as readonly string[]).includes(normalized)) {
    return { locale: normalized as Locale, rawCookie: value, hasExplicitPreference: true };
  }

  return { locale: 'en', rawCookie: value, hasExplicitPreference: false };
}

export function buildLocaleCookie(locale: Locale): string {
  return `${qrCommandLocaleCookie}=${encodeURIComponent(locale)}; Path=/; Max-Age=${60 * 60 * 24 * 365}; SameSite=Lax`;
}

export function writeLocaleCookie(locale: Locale): string {
  const cookie = buildLocaleCookie(locale);
  if (typeof document !== 'undefined') {
    document.cookie = cookie;
  }
  return cookie;
}

export function getLocaleLabel(locale: Locale): string {
  return localeNames[locale] ?? locale;
}

export function isRtl(locale: Locale): boolean {
  return localeDirections[locale] === 'rtl';
}
