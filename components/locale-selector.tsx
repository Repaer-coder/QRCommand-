'use client';

import React, { useId } from 'react';
import { supportedLocales, localeNames } from '@/lib/i18n/config';
import { writeLocaleCookie } from '@/lib/i18n/client';
import { useI18n } from '@/components/i18n-provider';
import type { Locale } from '@/lib/i18n/config';
import { useRouter } from 'next/navigation';

type LocaleSelectorProps = {
  compact?: boolean;
};

function isLocale(value: string): value is Locale {
  return (supportedLocales as readonly string[]).includes(value);
}

export default function LocaleSelector({ compact = false }: LocaleSelectorProps) {
  const { t, locale } = useI18n();
  const router = useRouterSafe();
  const labelId = useId();

  const selected = isLocale(locale) ? locale : 'en';

  function changeLocale(value: string) {
    if (!isLocale(value)) return;
    writeLocaleCookie(value);
    router?.refresh();
  }

  return (
    <label className={`locale-selector ${compact ? 'locale-selector-compact' : ''}`}> 
      <span id={labelId} className="locale-selector-label">
        {t('localeSelector.label')}
      </span>
      <select
        aria-label={t('localeSelector.actionLabel')}
        aria-labelledby={labelId}
        className="locale-selector-select"
        value={selected}
        onChange={(event) => changeLocale(event.target.value)}
      >
        {supportedLocales.map((localeCode) => (
          <option key={localeCode} value={localeCode}>
            {localeNames[localeCode]}
          </option>
        ))}
      </select>
    </label>
  );
}

function useRouterSafe() {
  try {
    return useRouter();
  } catch {
    return null;
  }
}
