'use client';

import React, { createContext, useContext, useMemo } from 'react';
import { type Locale } from '@/lib/i18n/config';
import en from '@/lib/i18n/dictionaries/en';
import type { TranslationDictionary } from '@/lib/i18n/translate';
import { getLocaleContext, type LocaleContext } from '@/lib/i18n/translate';

type I18nContextValue = LocaleContext;

const I18nContext = createContext<I18nContextValue | null>(null);

export default function I18nProvider({
  locale,
  dictionary,
  children,
}: {
  locale: Locale;
  dictionary: TranslationDictionary;
  children: React.ReactNode;
}) {
  const value = useMemo(() => getLocaleContext(locale, dictionary, en), [locale, dictionary]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const context = useContext(I18nContext);
  if (context) return context;
  return getLocaleContext('en', en, en);
}
