import { MESSAGES, getMessage, LanguageCode } from '@nestchat/shared';

export type Language = LanguageCode;

export interface LanguageDetectionResult {
  language: Language;
  confidence: number;
}

// ─── Devanagari Script Detection ─────────────────────────────────────────────
// Any Unicode codepoint in the Devanagari block (U+0900–U+097F) is a reliable
// indicator that the user is writing in Hindi/Marathi/Sanskrit script.
const DEVANAGARI_REGEX = /[\u0900-\u097F]/;

// ─── Romanized Hindi / Hinglish Patterns ─────────────────────────────────────
// Common words used in Hinglish (Roman-script Hindi) that do NOT appear in
// standard English sentences.
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
  /\bbatao\b/i,
  /\bkripya\b/i,
  /\bdhanyavaad\b/i,
  /\bnamaste\b/i,
  /\bhaan\b/i,
  /\bnahi\b/i,
  /\bnahi\b/i,
  /\bakela\b/i,
  /\bsab\b/i,
  /\bkuch\b/i,
  /\bhar\b/i,
  /\bbahut\b/i,
  /\bthoda\b/i,
  /\bzyada\b/i,
  /\bjaldi\b/i,
  /\bachha\b/i,
  /\bbura\b/i,
  /\bnaya\b/i,
  /\bpurana\b/i,
  /\bbada\b/i,
  /\bchota\b/i,
  // Additional common Hinglish words
  /\bkitna\b/i,
  /\bkitne\b/i,
  /\bkaise\b/i,
  /\bkahan\b/i,
  /\bkab\b/i,
  /\bkiska\b/i,
  /\bjab\b/i,
  /\btab\b/i,
  /\bwala\b/i,
  /\bwali\b/i,
  /\bbolo\b/i,
  /\bsamajh\b/i,
  /\bdekhna\b/i,
  /\bchahta\b/i,
  /\bchahti\b/i,
  /\baur\b/i,
  /\bpar\b/i,
  /\bphir\b/i,
  /\bkaro\b/i,
  /\bkarna\b/i,
  /\bhoga\b/i,
  /\bhogi\b/i,
  /\blena\b/i,
  /\bdena\b/i,
  /\bpani\b/i,
  /\bkhaana\b/i,
  /\bkhana\b/i,
  /\bpaise\b/i,
  /\bdaam\b/i,
  /\bseva\b/i,
  /\bjanakari\b/i,
  /\bjaankari\b/i,
  /\bsamay\b/i,
  /\bvakht\b/i,
  /\bwaqt\b/i,
  /\bshukriya\b/i,
  /\bshukriyaa\b/i,
  /\bjee\b/i,
  /\bji\b/i,
];

// ─── Language Engine ──────────────────────────────────────────────────────────

export class LanguageEngine {
  /**
   * Detect the language of the input text.
   * Priority:
   *   1. Devanagari Unicode script → definite Hindi
   *   2. Romanized Hindi word count ≥ 2 → Hindi/Hinglish
   *   3. Otherwise → English
   */
  static detect(text: string): LanguageDetectionResult {
    const normalizedText = text.toLowerCase().trim();

    // 1. Check for Devanagari script (most reliable signal)
    if (DEVANAGARI_REGEX.test(text)) {
      return { language: 'hi', confidence: 1 };
    }

    // 2. Count Romanized Hindi word matches
    let hindiMatches = 0;
    for (const pattern of HINDI_ROMAN_PATTERNS) {
      if (pattern.test(normalizedText)) {
        hindiMatches++;
        if (hindiMatches >= 3) break; // Early exit — sufficient confidence
      }
    }

    // 3. Check for well-known Hindi greeting phrases (even single-word)
    const hindiPhrases = [
      'namaste', 'namaskar', 'kaise ho', 'kya haal', 'hello ji', 'ji namaste',
      'shukriya', 'dhanyavaad', 'shukria',
    ];
    const containsHindiPhrase = hindiPhrases.some(p => normalizedText.includes(p));
    if (containsHindiPhrase) hindiMatches += 2;

    const confidence = Math.min(hindiMatches / 3, 1);

    return {
      language: hindiMatches >= 2 ? 'hi' : 'en',
      confidence,
    };
  }

  /**
   * Detect if the text is a mix of Hindi and English (Hinglish).
   * Used to decide whether to respond in Hinglish or pure English.
   */
  static isHinglish(text: string): boolean {
    const { language } = this.detect(text);
    if (language !== 'hi') return false;

    // Check if the text also contains substantial English words
    const englishWords = text.toLowerCase().match(/\b[a-z]{3,}\b/g) || [];
    const hindiPatternMatches = HINDI_ROMAN_PATTERNS.filter(p => p.test(text)).length;

    // Hinglish: has both English words and Hindi patterns
    return englishWords.length > 0 && hindiPatternMatches > 0 && !DEVANAGARI_REGEX.test(text);
  }

  static getMessage(lang: Language, key: keyof typeof MESSAGES.en, vars?: Record<string, string>): string {
    return getMessage(lang, key, vars);
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
