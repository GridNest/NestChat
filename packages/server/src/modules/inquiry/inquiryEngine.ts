import { InquiryStateModel, InquiryStateDocument } from './inquiryState.model.js';
import { ClientFormModel } from '../clientForm/clientForm.model.js';
import { FormSubmissionService } from '../clientForm/submission/formSubmissionService.js';
import { InquiryService } from './inquiry.service.js';
import { LanguageEngine, Language } from '../chat/languageEngine.js';
import { isValidEmail, isValidPhone } from '@nestchat/shared';
import { IntentDetector, Intent } from '../chat/intentDetector.js';
import { logger } from '../../utils/logger.js';



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
  options?: string[];
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
  {
    field: 'requiredFeatures',
    label: 'Required Features',
    labelHi: 'Required Features',
    prompt: 'What key features do you require? (e.g. Payment Gateway, Booking System, User Login, Mobile Design)',
    promptHi: 'Aapko kaunse zaroori features chahiye? (jaise Payment Gateway, Booking System, Login)',
    required: false,
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
];
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

  static async getStepsForClient(clientId: string, workflowType?: string): Promise<Array<InquiryStep | DynamicInquiryStep>> {
    try {
      const clientForms = await ClientFormModel.find({ clientId, isActive: true }).lean();
      if (clientForms && clientForms.length > 0) {
        const primaryForm = clientForms.find(f => f.isPrimary) || clientForms[0];
        if (primaryForm && primaryForm.fields && primaryForm.fields.length > 0) {
          const actionableFields = primaryForm.fields.filter(f => 
            f.type !== 'hidden' && 
            !['honeypot', 'templatesource', 'captcha', 'csrf', 'nonce', '_wpnonce'].includes(f.fieldName.toLowerCase()) &&
            !['honeypot', 'templatesource', 'captcha'].includes(f.label.toLowerCase())
          );
          const dynamicSteps: DynamicInquiryStep[] = actionableFields.map(f => {
            const promptPair = this.getPromptForField(f.mappedTo, f.label, f.fieldName, f.options);
            return {
              field: f.fieldName,
              label: f.label,
              labelHi: f.label,
              prompt: promptPair.en,
              promptHi: promptPair.hi,
              required: f.required,
              options: (f.options && f.options.length > 0) ? f.options : promptPair.options,
              validate: f.mappedTo === 'visitor.email' ? isValidEmail : (f.mappedTo === 'visitor.phone' ? isValidPhone : undefined),
              validationMessage: f.mappedTo === 'visitor.email' ? 'Please provide a valid email address.' : (f.mappedTo === 'visitor.phone' ? 'Please provide a valid phone number.' : undefined),
              validationMessageHi: f.mappedTo === 'visitor.email' ? 'Kripya sahi email address daalein.' : (f.mappedTo === 'visitor.phone' ? 'Kripya sahi phone number daalein.' : undefined),
            };
          });
          return dynamicSteps;
        }

      }
    } catch {
      /* fallback to default workflow */
    }
    return this.getStepsForWorkflow(workflowType);
  }

  private static getPromptForField(mappedTo: string, label: string, fieldName: string = '', formFieldOptions?: string[]): { en: string; hi: string; options?: string[] } {
    const normField = fieldName.toLowerCase().replace(/[-_]/g, '');
    const normLabel = label.toLowerCase();

    const isService = mappedTo === 'visitor.service' || normField.includes('service') || normLabel.includes('service');
    if (isService) {
      const opts = (formFieldOptions && formFieldOptions.length > 0) 
        ? formFieldOptions 
        : ['Hotel', 'Restaurant', 'Corporate', 'SEO', 'Maintenance', 'Template', 'Other'];
      return {
        en: 'Which Service are you interested in? (Please select an option below)',
        hi: 'Aap kis Service me interested hain? (Niche se option choose karein)',
        options: opts,
      };
    }

    if (mappedTo === 'visitor.name' || ['yourname', 'fullname', 'name', 'clientname', 'contactname'].includes(normField) || normLabel.includes('name')) {
      return { en: 'Sure! May I know your Full Name?', hi: 'Aapka Poora Naam kya hai?' };
    }
    if (mappedTo === 'visitor.email' || ['youremail', 'email', 'emailaddress', 'useremail'].includes(normField) || normLabel.includes('email')) {
      return { en: 'What is the best Email address to reach you?', hi: 'Aapka Email address kya hai?' };
    }
    if (mappedTo === 'visitor.phone' || ['yourphone', 'phone', 'mobile', 'phonenumber', 'contactnumber', 'tel'].includes(normField) || normLabel.includes('phone') || normLabel.includes('mobile')) {
      return { en: 'What is your Phone or Mobile number?', hi: 'Aapka Mobile number kya hai?' };
    }

    switch (mappedTo) {
      case 'visitor.message':
        return { en: 'What requirement or message would you like to share?', hi: 'Aapki kya requirement ya message hai?' };
      case 'visitor.company':
        return { en: 'What is your Business or Company name?', hi: 'Aapke Business ya Company ka naam kya hai?' };
      case 'visitor.date':
        return { en: 'What date would you prefer?', hi: 'Aap kaunsi date prefer karenge?' };
      case 'visitor.guests':
        return { en: 'How many guests or people will be joining?', hi: 'Kitne log join karenge?' };
      case 'visitor.occasion':
        return { en: 'What is the occasion or event type?', hi: 'Kaisa occasion ya event hai?' };
      case 'visitor.budget':
        return { en: 'What is your estimated Budget? (type "skip" to bypass)', hi: 'Aapka estimated Budget kya hai? (skip ke liye "skip" likhein)' };
      default:
        return { en: `Please provide your ${label}`, hi: `Kripya apna ${label} batayein` };
    }
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

    const steps = await this.getStepsForClient(data.clientId, data.workflowType);
    const initialStep = data.currentStep || (steps.length > 0 ? steps[0].field : (data.workflowType === 'lead_generation' ? 'businessName' : 'name'));
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

  static async mergeExtractedEntities(chatId: string, extracted: Record<string, string>): Promise<InquiryStateDocument | null> {
    const state = await InquiryStateModel.findOne({ chatId, status: { $in: ['active', 'paused'] } });
    if (!state || !extracted || Object.keys(extracted).length === 0) return state;

    if (!state.data) state.data = {};

    let hasChanges = false;
    for (const [key, value] of Object.entries(extracted)) {
      if (value && typeof value === 'string' && value.trim().length > 0) {
        if (!(state.data as any)[key]) {
          (state.data as any)[key] = value.trim();
          if (!state.completedFields.includes(key)) {
            state.completedFields.push(key);
          }
          hasChanges = true;
        }
      }
    }

    if (hasChanges) {
      const steps = await this.getStepsForClient(state.clientId.toString(), (state.data as any)?.workflowType);
      const nextUnfulfilled = steps.find(s => !(state.data as any)[s.field] && !state.skippedFields.includes(s.field));
      if (nextUnfulfilled) {
        state.currentStep = nextUnfulfilled.field;
      }
      state.markModified('data');
      state.markModified('completedFields');
      await state.save();
    }

    return state;
  }

  static async getNextUnfulfilledStep(state: InquiryStateDocument): Promise<InquiryStep | DynamicInquiryStep | null> {
    const steps = await this.getStepsForClient(state.clientId.toString(), (state.data as any)?.workflowType);
    for (const step of steps) {
      const val = (state.data as any)?.[step.field];
      const isSkipped = state.skippedFields?.includes(step.field);
      if (!val && !isSkipped) {
        return step;
      }
    }
    return null;
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
    options?: any;
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

        const steps = await this.getStepsForClient(state.clientId.toString(), (state.data as any)?.workflowType);
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

    const steps = await this.getStepsForClient(state.clientId.toString(), (state.data as any)?.workflowType);
    let currentStepConfig = steps.find(s => s.field === state.currentStep);

    if (!currentStepConfig) {
      const nextUnfulfilled = await this.getNextUnfulfilledStep(state);
      if (nextUnfulfilled) {
        state.currentStep = nextUnfulfilled.field;
        currentStepConfig = nextUnfulfilled;
      }
    }

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
      if (!state.data) state.data = {};
      (state.data as any)[currentStepConfig.field] = 'N/A';
      state.skippedFields.push(currentStepConfig.field);
    } else {
      if (!state.data) state.data = {};
      (state.data as any)[currentStepConfig.field] = input.trim();
      state.completedFields.push(currentStepConfig.field);
    }

    state.markModified('data');
    state.markModified('completedFields');
    state.markModified('skippedFields');

    const nextStep = await this.getNextUnfulfilledStep(state);

    if (nextStep) {
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
        options: (nextStep as any).options,
        isComplete: false,
      };

    }

    state.status = 'completed';
    state.completedAt = new Date();
    state.markModified('data');
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

    const nextStep = await this.getNextUnfulfilledStep(state);

    if (!nextStep) return null;

    if ('prompt' in nextStep) {
      return state.language === 'hi' ? nextStep.promptHi : nextStep.prompt;
    }
    return LanguageEngine.getMessage(state.language, (nextStep as InquiryStep).messageKey as any);
  }

  static async getCurrentQuestion(chatId: string): Promise<string | null> {
    const state = await InquiryStateModel.findOne({ chatId, status: { $in: ['active', 'paused'] } });
    if (!state) return null;

    if (state.currentStep === '__consent__') {
      return state.language === 'hi'
        ? 'Kya aap chahte hain ki main aapki baat humari team tak pahuncha doon? (Haan/Nahi)'
        : 'Would you like me to connect you with our team? (Yes/No)';
    }

    const nextStep = await this.getNextUnfulfilledStep(state);

    if (!nextStep) return null;

    state.currentStep = nextStep.field;
    const lang = state.language;

    const stepKey = nextStep.field.toLowerCase().replace(/[-_]/g, '');

    if (['name', 'yourname', 'fullname', 'clientname'].includes(stepKey)) {
      const biz = (state.data as any)?.businessName || (state.data as any)?.websiteType;
      if (biz) {
        return lang === 'hi'
          ? 'Dhanyawaad! Quotation prepare karne aur aage discuss karne ke liye, kya main aapka Poora Naam (Full Name) jaan sakta hoon?'
          : 'Thank you! So we can prepare a quotation and discuss further, may I know your Full Name?';
      }
      return lang === 'hi' ? 'Aapka Poora Naam kya hai?' : 'What is your Full Name?';
    }

    if (['phone', 'yourphone', 'mobile', 'phonenumber', 'tel'].includes(stepKey)) {
      return lang === 'hi'
        ? 'Humari team aapko contact kar sake, iske liye aapka Mobile Number kya hai?'
        : 'What is your Mobile Number so our team can get in touch with you?';
    }

    if (['email', 'youremail', 'emailaddress'].includes(stepKey)) {
      return lang === 'hi'
        ? 'Aapka Email address kya hai?'
        : 'What is your Email address?';
    }

    if ('prompt' in nextStep) {
      return lang === 'hi' ? nextStep.promptHi : nextStep.prompt;
    }

    return getIndustryStepPrompt(nextStep.field, state.industry, state.language);
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
