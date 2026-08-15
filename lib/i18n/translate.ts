import type { Locale } from './config';

export type TranslationDictionary = Record<string, unknown>;

export type TranslationValues = Record<string, string | number | boolean>;

export function getTranslationKeyPath(dictionary: TranslationDictionary, path: string): unknown {
  return path
    .split('.')
    .filter(Boolean)
    .reduce<unknown>((current, segment) => {
      if (!current || typeof current !== 'object' || !(segment in current)) {
        return undefined;
      }
      return (current as Record<string, unknown>)[segment];
    }, dictionary);
}

function interpolate(template: string, values?: TranslationValues): string {
  if (!values) return template;
  return Object.entries(values).reduce(
    (acc, [key, value]) => acc.replaceAll(`{${key}}`, String(value)),
    template
  );
}

export type Translator = (key: string, values?: TranslationValues) => string;

export function createTranslator(dictionary: TranslationDictionary, fallback: TranslationDictionary = {}): Translator {
  return (key, values) => {
    const value = getTranslationKeyPath(dictionary, key);
    if (typeof value === 'string') {
      return interpolate(value, values);
    }

    if (fallback && fallback !== dictionary) {
      const fallbackValue = getTranslationKeyPath(fallback, key);
      if (typeof fallbackValue === 'string') {
        return interpolate(fallbackValue, values);
      }
    }

    if (typeof value === 'string') return interpolate(value, values);
    return key;
  };
}

export function createNumberFormatter(locale: string, options?: Intl.NumberFormatOptions) {
  const safeLocale = locale || 'en';
  const formatter = new Intl.NumberFormat(safeLocale, options);
  return (value: number | bigint | null | undefined) => {
    if (value === null || value === undefined || Number.isNaN(Number(value))) return '—';
    return formatter.format(value as never);
  };
}

export const createDateFormatter = (locale: string, options: Intl.DateTimeFormatOptions = {}) => {
  const formatter = new Intl.DateTimeFormat(locale || 'en', { year: 'numeric', month: 'short', day: 'numeric', ...options });
  return (date: string | number | Date | null | undefined) => {
    if (!date) return '—';
    return formatter.format(new Date(date));
  };
};

export const createDateTimeFormatter = (locale: string, options: Intl.DateTimeFormatOptions = {}) => {
  const formatter = new Intl.DateTimeFormat(locale || 'en', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    ...options,
  });
  return (date: string | number | Date | null | undefined) => {
    if (!date) return '—';
    return formatter.format(new Date(date));
  };
};

export const createPercentFormatter = (locale: string, options: Intl.NumberFormatOptions = {}) => {
  const formatter = new Intl.NumberFormat(locale || 'en', { style: 'percent', minimumFractionDigits: 1, ...options });
  return (value: number | null | undefined) => {
    if (value === null || value === undefined || Number.isNaN(value)) return '—';
    return formatter.format(value);
  };
};

export const createCurrencyFormatter = (locale: string, currency = 'USD') => {
  const formatter = new Intl.NumberFormat(locale || 'en', { style: 'currency', currency, maximumFractionDigits: 0 });
  return (value: number | null | undefined) => {
    if (value === null || value === undefined || Number.isNaN(value)) return '—';
    return formatter.format(value);
  };
};

export type LocaleContext = {
  locale: Locale;
  t: Translator;
  getRaw: (key: string) => unknown;
  formatNumber: ReturnType<typeof createNumberFormatter>;
  formatInteger: ReturnType<typeof createNumberFormatter>;
  formatPercent: ReturnType<typeof createPercentFormatter>;
  formatDate: ReturnType<typeof createDateFormatter>;
  formatDateTime: ReturnType<typeof createDateTimeFormatter>;
  formatCurrency: ReturnType<typeof createCurrencyFormatter>;
};

export function getLocaleContext(locale: Locale, dictionary: TranslationDictionary, fallback: TranslationDictionary = {}): LocaleContext {
  return {
    locale,
    t: createTranslator(dictionary, fallback),
    getRaw: (key) => {
      const value = getTranslationKeyPath(dictionary, key);
      if (value === undefined) {
        return getTranslationKeyPath(fallback, key);
      }
      return value;
    },
    formatNumber: createNumberFormatter(locale),
    formatInteger: createNumberFormatter(locale, { maximumFractionDigits: 0 }),
    formatPercent: createPercentFormatter(locale),
    formatDate: createDateFormatter(locale),
    formatDateTime: createDateTimeFormatter(locale),
    formatCurrency: createCurrencyFormatter(locale),
  };
}
