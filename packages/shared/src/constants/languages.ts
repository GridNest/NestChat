export const LANGUAGES = {
  en: {
    code: 'en',
    name: 'English',
    nativeName: 'English',
  },
  hi: {
    code: 'hi',
    name: 'Hindi',
    nativeName: 'Hindi (Roman)',
  },
} as const;

export type LanguageCode = keyof typeof LANGUAGES;

export const DEFAULT_LANGUAGE: LanguageCode = 'en';
