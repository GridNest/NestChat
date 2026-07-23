import { InquiryStateModel, InquiryStateDocument } from './inquiryState.model';
import { LanguageEngine, Language } from '../chat/languageEngine';
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
    field: 'email',
    messageKey: 'inquiryEmail',
    messageKeyHi: 'inquiryEmail',
    required: true,
    validate: isValidEmail,
    validationMessage: 'Please enter a valid email address',
    validationMessageHi: 'Kripya sahi email address daalein',
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
    field: 'country',
    messageKey: 'inquiryCountry',
    messageKeyHi: 'inquiryCountry',
    required: true,
  },
  {
    field: 'state',
    messageKey: 'inquiryState',
    messageKeyHi: 'inquiryState',
    required: true,
  },
  {
    field: 'service',
    messageKey: 'inquiryService',
    messageKeyHi: 'inquiryService',
    required: true,
  },
  {
    field: 'details',
    messageKey: 'inquiryDetails',
    messageKeyHi: 'inquiryDetails',
    required: true,
    validate: (value) => value.trim().length >= 10,
    validationMessage: 'Please provide at least 10 characters',
    validationMessageHi: 'Kripya kam se kam 10 characters batayein',
  },
  {
    field: 'company',
    messageKey: 'inquiryCompany',
    messageKeyHi: 'inquiryCompany',
    required: false,
  },
];

export const CANCEL_KEYWORDS = ['cancel', 'restart', 'start over', 'exit', 'quit', 'band karo', 'rok do'];

export class InquiryEngine {
  static async createState(data: {
    chatId: string;
    sessionId: string;
    clientId: string;
    visitorId: string;
    language: Language;
  }): Promise<InquiryStateDocument> {
    const existing = await InquiryStateModel.findOne({
      chatId: data.chatId,
      status: 'active',
    });

    if (existing) {
      return existing;
    }

    return InquiryStateModel.create({
      ...data,
      currentStep: 'name',
      completedFields: [],
      skippedFields: [],
      data: {},
      status: 'active',
      startedAt: new Date(),
    });
  }

  static async getState(chatId: string): Promise<InquiryStateDocument | null> {
    return InquiryStateModel.findOne({ chatId, status: 'active' });
  }

  static async getStateBySession(sessionId: string): Promise<InquiryStateDocument | null> {
    return InquiryStateModel.findOne({ sessionId, status: 'active' });
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
      const message = LanguageEngine.getMessage(lang, nextStep.messageKey as any);

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
    await state.save();

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

    const currentStep = INQUIRY_STEPS.find(s => s.field === state.currentStep);
    if (!currentStep) return null;

    return LanguageEngine.getMessage(state.language, currentStep.messageKey as any);
  }

  static getProgress(chatId: string): Promise<{
    current: number;
    total: number;
    percentage: number;
  } | null> {
    return InquiryStateModel.findOne({ chatId, status: 'active' }).then(state => {
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
