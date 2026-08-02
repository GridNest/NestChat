import { InquiryStateModel, InquiryStateDocument } from './inquiryState.model.js';
import { LanguageEngine, Language } from '../chat/languageEngine.js';
import { isValidEmail, isValidPhone } from '@nestchat/shared';
import { IntentDetector, Intent } from '../chat/intentDetector.js';

export interface InquiryStep {
  field: string;
  messageKey: string;
  messageKeyHi: string;
  required: boolean;
  validate?: (value: string) => boolean;
  validationMessage?: string;
  validationMessageHi?: string;
}

export interface DynamicInquiryStep {
  field: string;
  label: string;
  labelHi: string;
  prompt: string;
  promptHi: string;
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

export const LEAD_CAPTURE_STEPS: DynamicInquiryStep[] = [
  {
    field: 'businessName',
    label: 'Business Name',
    labelHi: 'Business Name',
    prompt: 'What is your Business Name?',
    promptHi: 'Aapka Business Name kya hai?',
    required: true,
    validate: (val) => val.trim().length >= 2,
    validationMessage: 'Please enter your business name (at least 2 characters).',
    validationMessageHi: 'Kripya apna business name batayein (kam se kam 2 characters).',
  },
  {
    field: 'businessType',
    label: 'Business Type',
    labelHi: 'Business Type',
    prompt: 'What is your Business Type or Industry? (e.g. Restaurant, Hotel, Healthcare, Tech, Agency, Retail)',
    promptHi: 'Aapka Business Type ya Industry kya hai? (jaise Restaurant, Hotel, Tech, Agency)',
    required: true,
    validate: (val) => val.trim().length >= 2,
    validationMessage: 'Please specify your business type or industry.',
    validationMessageHi: 'Kripya apna business type ya industry batayein.',
  },
  {
    field: 'websiteType',
    label: 'Website Type',
    labelHi: 'Website Type',
    prompt: 'What type of Website or Service do you need? (e.g. E-Commerce, Corporate Website, Web App, Landing Page, Consultation)',
    promptHi: 'Aapko kis tarah ki website ya service chahiye? (jaise E-Commerce, Corporate, Landing Page, Consultation)',
    required: true,
    validate: (val) => val.trim().length >= 2,
    validationMessage: 'Please specify the website or service type.',
    validationMessageHi: 'Kripya website ya service type batayein.',
  },
  {
    field: 'requiredFeatures',
    label: 'Required Features',
    labelHi: 'Required Features',
    prompt: 'What key features do you require? (e.g. Payment Gateway, Booking System, User Login, Mobile Design)',
    promptHi: 'Aapko kaunse zaroori features chahiye? (jaise Payment Gateway, Booking System, Login)',
    required: true,
    validate: (val) => val.trim().length >= 2,
    validationMessage: 'Please mention a few required features.',
    validationMessageHi: 'Kripya zaroori features batayein.',
  },
  {
    field: 'budget',
    label: 'Budget',
    labelHi: 'Budget',
    prompt: 'What is your estimated Budget? (Optional - type "skip" to bypass)',
    promptHi: 'Aapka anumanit Budget kya hai? (Optional - skip karne ke liye "skip" likhein)',
    required: false,
  },
  {
    field: 'timeline',
    label: 'Timeline',
    labelHi: 'Timeline',
    prompt: 'What is your expected Timeline? (Optional - e.g. 2 weeks, 1 month - type "skip" to bypass)',
    promptHi: 'Aapka expected Timeline kya hai? (Optional - jaise 2 hafte, 1 mahina - "skip" likhein)',
    required: false,
  },
  {
    field: 'name',
    label: 'Name',
    labelHi: 'Naam',
    prompt: 'What is your Full Name?',
    promptHi: 'Aapka poora naam kya hai?',
    required: true,
    validate: (val) => val.trim().length >= 2,
    validationMessage: 'Please enter a valid name (at least 2 characters).',
    validationMessageHi: 'Kripya sahi naam batayein (kam se kam 2 characters).',
  },
  {
    field: 'phone',
    label: 'Mobile Number',
    labelHi: 'Mobile Number',
    prompt: 'What is your Mobile Number?',
    promptHi: 'Aapka Mobile Number kya hai?',
    required: true,
    validate: isValidPhone,
    validationMessage: 'Please enter a valid phone number.',
    validationMessageHi: 'Kripya sahi phone number daalein.',
  },
  {
    field: 'email',
    label: 'Email',
    labelHi: 'Email',
    prompt: 'What is your Email address?',
    promptHi: 'Aapka Email address kya hai?',
    required: true,
    validate: isValidEmail,
    validationMessage: 'Please enter a valid email address.',
    validationMessageHi: 'Kripya sahi email address daalein.',
  },
];

export const CANCEL_KEYWORDS = ['cancel', 'restart', 'start over', 'exit', 'quit', 'band karo', 'rok do', 'nahi', 'no thanks', "no, don't", "don't", 'no'];

export function getIndustryStepPrompt(field: string, industry?: string, lang: 'en' | 'hi' = 'en'): string {
  // Check Lead Capture steps first
  const leadStep = LEAD_CAPTURE_STEPS.find(s => s.field === field);
  if (leadStep) {
    return lang === 'hi' ? leadStep.promptHi : leadStep.prompt;
  }

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
  static getStepsForWorkflow(workflowType?: string): Array<InquiryStep | DynamicInquiryStep> {
    if (workflowType === 'lead_generation' || workflowType === 'website_consultation') {
      return LEAD_CAPTURE_STEPS;
    }
    return INQUIRY_STEPS;
  }

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
    workflowType?: string;
  }): Promise<InquiryStateDocument> {
    const existing = await InquiryStateModel.findOne({
      chatId: data.chatId,
      status: { $in: ['active', 'paused'] },
    });

    if (existing) {
      existing.status = 'active';
      await existing.save();
      return existing;
    }

    const initialStep = data.currentStep || (data.workflowType === 'lead_generation' ? 'businessName' : 'name');
    const initialData = { ...(data.data || {}), workflowType: data.workflowType || 'general_inquiry' };

    return InquiryStateModel.create({
      chatId: data.chatId,
      sessionId: data.sessionId,
      clientId: data.clientId,
      visitorId: data.visitorId,
      language: data.language,
      currentStep: initialStep,
      completedFields: [],
      skippedFields: [],
      data: initialData,
      status: 'active',
      originalQuestion: data.originalQuestion,
      industry: data.industry,
      startedAt: new Date(),
    });
  }

  static async getState(chatId: string): Promise<InquiryStateDocument | null> {
    return InquiryStateModel.findOne({ chatId, status: 'active' });
  }

  static async getActiveOrPausedState(chatId: string): Promise<InquiryStateDocument | null> {
    return InquiryStateModel.findOne({ chatId, status: { $in: ['active', 'paused'] } });
  }

  static async getStateBySession(sessionId: string): Promise<InquiryStateDocument | null> {
    return InquiryStateModel.findOne({ sessionId, status: { $in: ['active', 'paused'] } });
  }

  static isConsentResponse(input: string): boolean {
    const normalized = input.toLowerCase().trim();
    return CONSENT_KEYWORDS.some(keyword => normalized === keyword || normalized.startsWith(keyword));
  }

  static isInterruptionQuery(input: string, language: string, currentStep?: string): boolean {
    const normalized = input.toLowerCase().trim();

    if (CANCEL_KEYWORDS.some(k => normalized.includes(k))) return false;
    if (IntentDetector.isResumeRequest(input)) return false;

    // Check if input satisfies field validation directly
    if (currentStep === 'phone' && isValidPhone(input)) return false;
    if (currentStep === 'email' && isValidEmail(input)) return false;

    const intentResult = IntentDetector.detect(input, language);
    const businessIntents: Intent[] = [
      'menu', 'pricing', 'contact', 'faq', 'complaint', 'location',
      'products', 'services', 'hours', 'events', 'career', 'support',
      'human_agent', 'gallery', 'order', 'delivery', 'offers', 'about', 'greeting'
    ];

    if (businessIntents.includes(intentResult.intent) && intentResult.confidence >= 0.4) {
      return true;
    }

    const questionPatterns = [
      /\?$/,
      /^(what|where|when|how|why|who|can i|do you|show me|tell me|is there|list|display|give me|do u)\b/i,
      /\b(batao|kya|kahan|kab|kaise|dikhao|bataie)\b/i,
    ];

    if (questionPatterns.some(p => p.test(normalized))) {
      return true;
    }

    return false;
  }

  static async pauseState(chatId: string): Promise<InquiryStateDocument | null> {
    const state = await InquiryStateModel.findOne({ chatId, status: 'active' });
    if (state) {
      state.status = 'paused';
      state.pausedAt = new Date();
      await state.save();
    }
    return state;
  }

  static async resumeState(chatId: string): Promise<{ state: InquiryStateDocument | null; message: string }> {
    const state = await InquiryStateModel.findOne({ chatId, status: { $in: ['active', 'paused'] } });
    if (!state) {
      return { state: null, message: '' };
    }

    state.status = 'active';
    await state.save();

    const question = await this.getCurrentQuestion(chatId);
    return {
      state,
      message: question || 'Please provide the next detail.',
    };
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
    const state = await InquiryStateModel.findOne({ chatId, status: { $in: ['active', 'paused'] } });
    if (!state) {
      return {
        success: false,
        message: 'No active inquiry found',
      };
    }

    state.status = 'active';

    const normalizedInput = input.toLowerCase().trim();
    if (CANCEL_KEYWORDS.some(keyword => normalizedInput.includes(keyword))) {
      return this.cancelInquiry(state);
    }

    // Check if we're waiting for consent first
    if (state.currentStep === '__consent__') {
      if (this.isConsentResponse(input)) {
        const isLeadGen = (state.data as any)?.workflowType === 'lead_generation';
        state.currentStep = isLeadGen ? 'businessName' : 'name';
        await state.save();

        const steps = this.getStepsForWorkflow((state.data as any)?.workflowType);
        const firstStep = steps[0];
        const message = (firstStep as DynamicInquiryStep).prompt || LanguageEngine.getMessage(state.language, (firstStep as InquiryStep).messageKey as any);
        return {
          success: true,
          message,
          nextStep: state.currentStep,
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

    const steps = this.getStepsForWorkflow((state.data as any)?.workflowType);
    const currentStepConfig = steps.find(s => s.field === state.currentStep);

    if (!currentStepConfig) {
      return {
        success: false,
        message: 'Invalid inquiry step',
      };
    }

    const isOptional = !currentStepConfig.required;
    const isSkipInput = normalizedInput === 'skip' || normalizedInput === 'next' || normalizedInput === 'n/a';

    if (!isOptional || !isSkipInput) {
      if (currentStepConfig.validate && !currentStepConfig.validate(input)) {
        const lang = state.language;
        const msg = (currentStepConfig as DynamicInquiryStep).validationMessage ||
          (lang === 'hi'
            ? currentStepConfig.validationMessageHi || LanguageEngine.getInvalidPhone(lang)
            : currentStepConfig.validationMessage || LanguageEngine.getInvalidEmail(lang));
        return {
          success: false,
          message: msg,
        };
      }
    }

    if (isOptional && isSkipInput) {
      (state.data as any)[currentStepConfig.field] = 'N/A';
      state.skippedFields.push(currentStepConfig.field);
    } else {
      (state.data as any)[currentStepConfig.field] = input.trim();
      state.completedFields.push(currentStepConfig.field);
    }

    const currentIndex = steps.findIndex(s => s.field === state.currentStep);
    const nextIndex = currentIndex + 1;

    if (nextIndex < steps.length) {
      const nextStep = steps[nextIndex];
      state.currentStep = nextStep.field;
      await state.save();

      const lang = state.language;
      let message = '';
      if ('prompt' in nextStep) {
        message = lang === 'hi' ? nextStep.promptHi : nextStep.prompt;
      } else {
        message = getIndustryStepPrompt(nextStep.field, state.industry, lang);
      }

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

    const completionMsg = state.language === 'hi'
      ? 'Aapka dhanyawaad! Hamari team aapko 24 ghante ke andar contact karegi.'
      : 'Thank you! Our team will contact you within 24 hours.';

    return {
      success: true,
      message: completionMsg,
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
    const state = await InquiryStateModel.findOne({ chatId, status: { $in: ['active', 'paused'] } });
    if (!state) return null;

    const steps = this.getStepsForWorkflow((state.data as any)?.workflowType);
    const firstStep = steps[0];
    if ('prompt' in firstStep) {
      return state.language === 'hi' ? firstStep.promptHi : firstStep.prompt;
    }
    return LanguageEngine.getMessage(state.language, firstStep.messageKey as any);
  }

  static async getCurrentQuestion(chatId: string): Promise<string | null> {
    const state = await InquiryStateModel.findOne({ chatId, status: { $in: ['active', 'paused'] } });
    if (!state) return null;

    if (state.currentStep === '__consent__') {
      return state.language === 'hi'
        ? 'Kya aap chahte hain ki main aapki baat humari team tak pahuncha doon? (Haan/Nahi)'
        : 'Would you like me to connect you with our team? (Yes/No)';
    }

    const steps = this.getStepsForWorkflow((state.data as any)?.workflowType);
    const currentStep = steps.find(s => s.field === state.currentStep);
    if (!currentStep) return null;

    if ('prompt' in currentStep) {
      return state.language === 'hi' ? currentStep.promptHi : currentStep.prompt;
    }

    return getIndustryStepPrompt(currentStep.field, state.industry, state.language);
  }

  static getProgress(chatId: string): Promise<{
    current: number;
    total: number;
    percentage: number;
  } | null> {
    return InquiryStateModel.findOne({ chatId, status: { $in: ['active', 'paused'] } }).then((state: any) => {
      if (!state) return null;
      const steps = InquiryEngine.getStepsForWorkflow((state.data as any)?.workflowType);
      const current = state.completedFields.length;
      const total = steps.filter(s => s.required).length;
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
