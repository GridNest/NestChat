import { InquiryStateModel, InquiryStateDocument } from './inquiryState.model.js';
import { LanguageEngine, Language } from '../chat/languageEngine.js';
import { isValidEmail, isValidPhone } from '@nestchat/shared';

export interface InquiryStep {
  field: string;
  messageKey: string;
  messageKeyHi: string;
  required: boolean;
  validate?: (value: string) => boolean;
  validationMessage?: string;
  validationMessageHi?: string;
}

export const INQUIRY_STEPS: InquiryStep[] = [
  {
    field: 'name',
    messageKey: 'inquiryName',
    messageKeyHi: 'inquiryName',
    required: true,
    validate: (value) => value.trim().length >= 2,
    validationMessage: 'Name must be at least 2 characters',
    validationMessageHi: 'Naam kam se kam 2 characters ka hona chahiye',
  },
  {
    field: 'phone',
    messageKey: 'inquiryPhone',
    messageKeyHi: 'inquiryPhone',
    required: true,
    validate: isValidPhone,
    validationMessage: 'Please enter a valid phone number',
    validationMessageHi: 'Kripya sahi phone number daalein',
  },
  {
    field: 'email',
    messageKey: 'inquiryEmail',
    messageKeyHi: 'inquiryEmail',
    required: true,
    validate: isValidEmail,
    validationMessage: 'Please enter a valid email address',
    validationMessageHi: 'Kripya sahi email address daalein',
  },
  {
    field: 'message',
    messageKey: 'inquiryDetails',
    messageKeyHi: 'inquiryDetails',
    required: true,
    validate: (value) => value.trim().length >= 2,
    validationMessage: 'Please provide at least 2 characters',
    validationMessageHi: 'Kripya kam se kam 2 characters batayein',
  },
];

export const CANCEL_KEYWORDS = ['cancel', 'restart', 'start over', 'exit', 'quit', 'band karo', 'rok do', 'nahi', 'no thanks', "no, don't", "don't", 'no'];

export function getIndustryStepPrompt(field: string, industry?: string, lang: 'en' | 'hi' = 'en'): string {
  if (field !== 'message') {
    const step = INQUIRY_STEPS.find(s => s.field === field);
    if (!step) return '';
    return LanguageEngine.getMessage(lang, step.messageKey as any);
  }

  const norm = (industry || 'corporate').toLowerCase().replace(/[^a-z0-9_]/g, '_');
  const prompts: Record<string, { en: string; hi: string }> = {
    restaurant: {
      en: 'Please share your booking requirement (e.g. date, time, number of guests).',
      hi: 'Kripya apni booking requirement batayein (date, time, number of guests).',
    },
    hotel: {
      en: 'Please share your stay requirement (e.g. check-in date, rooms, guests).',
      hi: 'Kripya apni stay requirement batayein (check-in date, rooms).',
    },
    hospital: {
      en: 'Please describe your appointment requirement (e.g. department, doctor).',
      hi: 'Kripya apni appointment requirement batayein (department, doctor).',
    },
    clinic: {
      en: 'Please describe your appointment requirement (e.g. doctor, preferred timing).',
      hi: 'Kripya apni appointment requirement batayein (doctor, timing).',
    },
    school: {
      en: 'Please share your admission inquiry (e.g. class/grade, academic year).',
      hi: 'Kripya apni admission inquiry batayein (class, academic year).',
    },
    corporate: {
      en: 'Please describe your project requirement.',
      hi: 'Kripya apni project requirement batayein.',
    },
    salon: {
      en: 'Please describe your appointment requirement (e.g. service, preferred time).',
      hi: 'Kripya apni appointment requirement batayein (service, time).',
    },
    real_estate: {
      en: 'Please share your property requirement (e.g. location, budget, type).',
      hi: 'Kripya apni property requirement batayein (location, budget).',
    },
    ecommerce: {
      en: 'Please describe your product requirement or order inquiry.',
      hi: 'Kripya apni product requirement ya order inquiry batayein.',
    },
  };

  const p = prompts[norm] || prompts.corporate;
  return lang === 'hi' ? p.hi : p.en;
}

const CONSENT_KEYWORDS = ['yes', 'haan', 'hmm', 'ok', 'sure', 'okay', 'haa', 'haanji', 'theek hai', 'haye', 'plz', 'please'];

export class InquiryEngine {
  static async createState(data: {
    chatId: string;
    sessionId: string;
    clientId: string;
    visitorId: string;
    language: Language;
    data?: Record<string, string>;
    currentStep?: string;
    originalQuestion?: string;
    industry?: string;
  }): Promise<InquiryStateDocument> {
    const existing = await InquiryStateModel.findOne({
      chatId: data.chatId,
      status: 'active',
    });

    if (existing) {
      return existing;
    }

    return InquiryStateModel.create({
      chatId: data.chatId,
      sessionId: data.sessionId,
      clientId: data.clientId,
      visitorId: data.visitorId,
      language: data.language,
      currentStep: data.currentStep || 'name',
      completedFields: [],
      skippedFields: [],
      data: data.data || {},
      status: 'active',
      originalQuestion: data.originalQuestion,
      industry: data.industry,
      startedAt: new Date(),
    });
  }

  static async getState(chatId: string): Promise<InquiryStateDocument | null> {
    return InquiryStateModel.findOne({ chatId, status: 'active' });
  }

  static async getStateBySession(sessionId: string): Promise<InquiryStateDocument | null> {
    return InquiryStateModel.findOne({ sessionId, status: 'active' });
  }

  static isConsentResponse(input: string): boolean {
    const normalized = input.toLowerCase().trim();
    return CONSENT_KEYWORDS.some(keyword => normalized === keyword || normalized.startsWith(keyword));
  }

  static async processInput(
    chatId: string,
    input: string
  ): Promise<{
    success: boolean;
    message: string;
    nextStep?: string;
    isComplete?: boolean;
    isCancelled?: boolean;
    isPendingConsent?: boolean;
    data?: Record<string, string>;
  }> {
    const state = await InquiryStateModel.findOne({ chatId, status: 'active' });
    if (!state) {
      return {
        success: false,
        message: 'No active inquiry found',
      };
    }

    const normalizedInput = input.toLowerCase().trim();
    if (CANCEL_KEYWORDS.some(keyword => normalizedInput.includes(keyword))) {
      return this.cancelInquiry(state);
    }

    // Check if we're waiting for consent first
    if (state.currentStep === '__consent__') {
      if (this.isConsentResponse(input)) {
        state.currentStep = 'name';
        await state.save();
        const firstStep = INQUIRY_STEPS[0];
        const message = LanguageEngine.getMessage(state.language, firstStep.messageKey as any);
        return {
          success: true,
          message,
          nextStep: 'name',
          isComplete: false,
        };
      } else {
        state.status = 'cancelled';
        state.cancelledAt = new Date();
        await state.save();
        const message = state.language === 'hi'
          ? 'Koi baat nahi! Agar aapko kuch aur chahiye toh bataayein.'
          : 'No problem! Let me know if you need anything else.';
        return {
          success: true,
          message,
          isCancelled: true,
        };
      }
    }

    const currentStepConfig = INQUIRY_STEPS.find(s => s.field === state.currentStep);
    if (!currentStepConfig) {
      return {
        success: false,
        message: 'Invalid inquiry step',
      };
    }

    if (currentStepConfig.validate && !currentStepConfig.validate(input)) {
      const lang = state.language;
      return {
        success: false,
        message: lang === 'hi'
          ? currentStepConfig.validationMessageHi || LanguageEngine.getInvalidPhone(lang)
          : currentStepConfig.validationMessage || LanguageEngine.getInvalidEmail(lang),
      };
    }

    (state.data as any)[currentStepConfig.field] = input.trim();
    state.completedFields.push(currentStepConfig.field);

    const currentIndex = INQUIRY_STEPS.findIndex(s => s.field === state.currentStep);
    const nextIndex = currentIndex + 1;

    if (nextIndex < INQUIRY_STEPS.length) {
      const nextStep = INQUIRY_STEPS[nextIndex];
      state.currentStep = nextStep.field;
      await state.save();

      const lang = state.language;
      const message = getIndustryStepPrompt(nextStep.field, state.industry, lang);

      return {
        success: true,
        message,
        nextStep: nextStep.field,
        isComplete: false,
      };
    }

    state.status = 'completed';
    state.completedAt = new Date();
    await state.save();

    return {
      success: true,
      message: LanguageEngine.getInquiryComplete(state.language),
      isComplete: true,
      data: state.data as Record<string, string>,
    };
  }

  static async cancelInquiry(
    state: InquiryStateDocument
  ): Promise<{
    success: boolean;
    message: string;
    isCancelled: boolean;
  }> {
    state.status = 'cancelled';
    state.cancelledAt = new Date();
    await (state as any).save();

    return {
      success: true,
      message: LanguageEngine.getInquiryCancelled(state.language),
      isCancelled: true,
    };
  }

  static async getFirstQuestion(chatId: string): Promise<string | null> {
    const state = await InquiryStateModel.findOne({ chatId, status: 'active' });
    if (!state) return null;

    const firstStep = INQUIRY_STEPS[0];
    return LanguageEngine.getMessage(state.language, firstStep.messageKey as any);
  }

  static async getCurrentQuestion(chatId: string): Promise<string | null> {
    const state = await InquiryStateModel.findOne({ chatId, status: 'active' });
    if (!state) return null;

    if (state.currentStep === '__consent__') {
      return state.language === 'hi'
        ? 'Kya aap chahte hain ki main aapki baat humari team tak pahuncha doon? (Haan/Nahi)'
        : 'Would you like me to connect you with our team? (Yes/No)';
    }

    const currentStep = INQUIRY_STEPS.find(s => s.field === state.currentStep);
    if (!currentStep) return null;

    return getIndustryStepPrompt(currentStep.field, state.industry, state.language);
  }

  static getProgress(chatId: string): Promise<{
    current: number;
    total: number;
    percentage: number;
  } | null> {
    return InquiryStateModel.findOne({ chatId, status: 'active' }).then((state: any) => {
      if (!state) return null;
      const current = state.completedFields.length;
      const total = INQUIRY_STEPS.filter(s => s.required).length;
      return {
        current,
        total,
        percentage: Math.round((current / total) * 100),
      };
    });
  }

  static isCancelRequest(input: string): boolean {
    const normalized = input.toLowerCase().trim();
    return CANCEL_KEYWORDS.some(keyword => normalized.includes(keyword));
  }

  static getServiceOptions(): string[] {
    return [
      'Website Development',
      'Hotel Website',
      'Restaurant Website',
      'Corporate Website',
      'Landing Page',
      'E-commerce Website',
      'Maintenance',
      'Custom Solution',
    ];
  }
}
