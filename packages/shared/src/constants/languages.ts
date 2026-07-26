export const LANGUAGES = {
  en: { code: 'en', name: 'English', nativeName: 'English' },
  hi: { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
  bn: { code: 'bn', name: 'Bengali', nativeName: 'বাংলা' },
  gu: { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી' },
  mr: { code: 'mr', name: 'Marathi', nativeName: 'मराठी' },
  ta: { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்' },
  te: { code: 'te', name: 'Telugu', nativeName: 'తెలుగు' },
  kn: { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ' },
  ml: { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം' },
  pa: { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ' },
  or: { code: 'or', name: 'Odia', nativeName: 'ଓଡ଼ିଆ' },
} as const;

export type LanguageCode = keyof typeof LANGUAGES;

export const SUPPORTED_LANGUAGES = Object.keys(LANGUAGES) as LanguageCode[];

export const DEFAULT_LANGUAGE: LanguageCode = 'en';

export function isLanguageCode(code: string): code is LanguageCode {
  return code in LANGUAGES;
}

export const DEFAULT_TRANSLATION_KEYS = [
  'welcome',
  'greeting',
  'unknownResponse',
  'inquiryPrompt',
  'inquiryName',
  'inquiryEmail',
  'inquiryPhone',
  'inquiryCountry',
  'inquiryState',
  'inquiryService',
  'inquiryDetails',
  'inquiryCompany',
  'inquiryComplete',
  'inquiryCancelled',
  'invalidEmail',
  'invalidPhone',
  'requiredField',
  'tryAgain',
  'endChat',
  'typeMessage',
  'send',
  'end',
] as const;

export type TranslationKey = typeof DEFAULT_TRANSLATION_KEYS[number];
