import { MESSAGES, MessageLanguage, getMessage } from '@nestchat/shared';

export type Language = 'en' | 'hi';

export interface LanguageDetectionResult {
  language: Language;
  confidence: number;
}

const HINDI_ROMAN_PATTERNS = [
  /\baap\b/i,
  /\bkya\b/i,
  /\bhai\b/i,
  /\bmein\b/i,
  /\bmera\b/i,
  /\btera\b/i,
  /\byeh\b/i,
  /\bwoh\b/i,
  /\bse\b/i,
  /\bko\b/i,
  /\bka\b/i,
  /\bki\b/i,
  /\bnaam\b/i,
  /\bswal\b/i,
  /\bjawab\b/i,
  /\bmadad\b/i,
  /\bchahiye\b/i,
  /\bbata\b/i,
  /\bbataye\b/i,
  /\bkripya\b/i,
  /\bdhanyavaad\b/i,
  /\bnamaste\b/i,
  /\bhaan\b/i,
  /\bnahi\b/i,
  /\bakela\b/i,
  /\bsab\b/i,
  /\bkuch\b/i,
  /\bhar\b/i,
  /\bbahut\b/i,
  /\bthoda\b/i,
  /\bzyada\b/i,
  /\bjaldi\b/i,
  /\bbad\b/i,
  /\bachha\b/i,
  /\bbura\b/i,
  /\bnaya\b/i,
  /\bpurana\b/i,
  /\bbada\b/i,
  /\bchota\b/i,
];

export class LanguageEngine {
  static detect(text: string): LanguageDetectionResult {
    const normalizedText = text.toLowerCase().trim();
    
    let hindiMatches = 0;
    for (const pattern of HINDI_ROMAN_PATTERNS) {
      if (pattern.test(normalizedText)) {
        hindiMatches++;
      }
    }

    const confidence = Math.min(hindiMatches / 3, 1);

    return {
      language: hindiMatches >= 2 ? 'hi' : 'en',
      confidence,
    };
  }

  static getMessage(lang: Language, key: keyof typeof MESSAGES.en, vars?: Record<string, string>): string {
    return getMessage(lang as MessageLanguage, key, vars);
  }

  static getWelcomeMessage(lang: Language, botName: string): string {
    return this.getMessage(lang, 'welcome', { botName });
  }

  static getGreetingMessage(lang: Language, clientName: string): string {
    return this.getMessage(lang, 'greeting', { clientName });
  }

  static getUnknownResponse(lang: Language): string {
    return this.getMessage(lang, 'unknownResponse');
  }

  static getInquiryPrompt(lang: Language): string {
    return this.getMessage(lang, 'inquiryPrompt');
  }

  static getInquiryStep(lang: Language, step: string): string {
    const key = `inquiry${step.charAt(0).toUpperCase() + step.slice(1)}` as keyof typeof MESSAGES.en;
    return this.getMessage(lang, key);
  }

  static getInquiryComplete(lang: Language): string {
    return this.getMessage(lang, 'inquiryComplete');
  }

  static getInquiryCancelled(lang: Language): string {
    return this.getMessage(lang, 'inquiryCancelled');
  }

  static getInvalidEmail(lang: Language): string {
    return this.getMessage(lang, 'invalidEmail');
  }

  static getInvalidPhone(lang: Language): string {
    return this.getMessage(lang, 'invalidPhone');
  }

  static getRequiredField(lang: Language): string {
    return this.getMessage(lang, 'requiredField');
  }

  static getEndChat(lang: Language): string {
    return this.getMessage(lang, 'endChat');
  }

  static formatForLanguage(text: string, lang: Language): string {
    if (lang === 'hi') {
      return text;
    }
    return text;
  }

  static isHindi(text: string): boolean {
    const result = this.detect(text);
    return result.language === 'hi';
  }

  static shouldUseHindi(sessionLanguage: Language, detectedLanguage: Language): boolean {
    return sessionLanguage === 'hi';
  }
}
