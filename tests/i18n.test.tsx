import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import { normalizeLocale, resolveLocaleFromAcceptLanguage, resolveLocaleForRequest, localeDirections } from '@/lib/i18n/config';
import { getLocaleCookieValue, getLocaleFromCookie, writeLocaleCookie } from '@/lib/i18n/client';
import I18nProvider from '@/components/i18n-provider';
import SiteNav from '@/components/site-nav';
import LocaleSelector from '@/components/locale-selector';
import en from '@/lib/i18n/dictionaries/en';
import type { TranslationDictionary } from '@/lib/i18n/translate';
import { usePathname } from 'next/navigation';
vi.mock('next/navigation', () => ({
  usePathname: vi.fn(),
  useRouter: vi.fn(),
}));

describe('i18n locale resolution', () => {
  it('defaults to English when no hint exists', () => {
    expect(resolveLocaleForRequest({ localeCookie: null, acceptLanguage: null })).toBe('en');
  });

  it('uses Accept-Language locale when cookie is absent', () => {
    const resolved = resolveLocaleFromAcceptLanguage('es-MX, en-US;q=0.6');
    expect(resolved).toBe('es');
  });

  it('uses explicit locale cookie over Accept-Language', () => {
    const resolved = resolveLocaleForRequest({ localeCookie: 'fr', acceptLanguage: 'es-ES, en-US;q=0.8' });
    expect(resolved).toBe('fr');
  });

  it('falls back to English for unsupported locale', () => {
    const resolved = resolveLocaleFromAcceptLanguage('xx-YY, zz-ZZ;q=0.4');
    expect(resolved).toBe('en');
  });

  it('maps regional locale to base locale', () => {
    expect(normalizeLocale('es-MX')).toBe('es');
    expect(resolveLocaleForRequest({ localeCookie: 'pt-BR', acceptLanguage: null })).toBe('pt');
  });

  it('marks Arabic as RTL', () => {
    expect(localeDirections.ar).toBe('rtl');
  });

  it('reads and normalizes locale cookies', () => {
    const value = getLocaleCookieValue('qr-command-locale=es-MX; theme=dark');
    const fallback = getLocaleFromCookie('qr-command-locale=xx-YY');

    expect(value).toBe('es-MX');
    expect(fallback).toEqual({ locale: 'en', rawCookie: 'xx-YY', hasExplicitPreference: false });
  });

  it('persists locale preference in a browser cookie', () => {
    const cookie = writeLocaleCookie('fr');
    expect(cookie).toContain('qr-command-locale=fr');
  });
});

describe('locale user-interface behavior', () => {
  it('renders translated public nav labels when locale changes', () => {
    vi.mocked(usePathname).mockReturnValue('/');
    const translated: TranslationDictionary = {
      navigation: {
        platform: 'Plataforma',
        systems: 'Sistemas',
        pricing: 'Precios',
        support: 'Ayuda',
        signIn: 'Entrar',
        startBuilding: 'Empezar',
        public: 'Navegación pública',
        publicLabel: 'n/a',
      },
    };

    const html = renderToString(
      <I18nProvider locale="es" dictionary={translated}>
        <SiteNav />
      </I18nProvider>
    );

    expect(html).toContain('Plataforma');
    expect(html).toContain('Empezar');
    expect(html).toContain('Navegación pública');
  });

  it('renders locale selector control with supported locale choices', () => {
    const html = renderToString(
      <I18nProvider locale="en" dictionary={en}>
        <LocaleSelector compact />
      </I18nProvider>
    );

    expect(html).toContain('locale-selector');
    expect(html).toContain('locale-selector-label');
    expect(html).toContain('value="fr"');
  });
});
