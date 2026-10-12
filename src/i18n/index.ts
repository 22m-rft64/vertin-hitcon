import en from './locales/en';
import ko from './locales/ko';
import ja from './locales/ja';
import fi from './locales/fi';

export type SupportedLang = 'ko' | 'en' | 'ja' | 'fi';

type I18nKey = keyof typeof en;

const locales: Record<SupportedLang, Record<I18nKey, string>> = { en, ko, ja, fi };

export const t = (key: I18nKey, lang: SupportedLang = 'en'): string => {
  return locales[lang]?.[key] ?? locales.en[key] ?? key;
};

/**
 * Discord interaction.locale → SupportedLang
 */
export const resolveLocale = (discordLocale: string): SupportedLang => {
  if (discordLocale === 'ko') return 'ko';
  if (discordLocale === 'ja') return 'ja';
  if (discordLocale === 'fi') return 'fi';
  return 'en';
};

export type { I18nKey };
