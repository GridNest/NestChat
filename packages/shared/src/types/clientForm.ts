export type FormFieldType = 
  | 'text' 
  | 'email' 
  | 'tel' 
  | 'number' 
  | 'textarea' 
  | 'select' 
  | 'checkbox' 
  | 'radio' 
  | 'date' 
  | 'time' 
  | 'hidden' 
  | 'other';

export type FormMappingTarget = 
  | 'visitor.name'
  | 'visitor.email'
  | 'visitor.phone'
  | 'visitor.message'
  | 'visitor.company'
  | 'visitor.subject'
  | 'visitor.date'
  | 'visitor.guests'
  | 'visitor.occasion'
  | 'visitor.budget'
  | 'visitor.address'
  | 'visitor.custom';

export type FormType = 
  | 'contact'
  | 'inquiry'
  | 'booking'
  | 'reservation'
  | 'quote'
  | 'newsletter'
  | 'application'
  | 'custom';

export type FormSubmissionType = 
  | 'html_form'
  | 'api_endpoint'
  | 'wordpress'
  | 'webhook'
  | 'unsupported';

export interface ClientFormField {
  fieldId: string;
  fieldName: string;
  label: string;
  type: FormFieldType;
  required: boolean;
  options?: string[];
  placeholder?: string;
  mappedTo: FormMappingTarget;
  customKey?: string;
}

export interface ClientForm {
  id?: string;
  _id?: string;
  clientId: string;
  formId: string;
  formName: string;
  pageUrl: string;
  action: string;
  method: 'GET' | 'POST';
  fields: ClientFormField[];
  formType: FormType;
  isActive: boolean;
  isPrimary: boolean;
  lastScanned?: Date;
  submissionType: FormSubmissionType;
  submissionEndpoint?: string;
  headers?: Record<string, string>;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface FormSubmissionPayload {
  clientId: string;
  formId: string;
  chatId?: string;
  sessionId?: string;
  data: Record<string, any>;
}

export interface FormSubmissionResult {
  success: boolean;
  submissionStatus: 'submitted' | 'failed' | 'fallback';
  submissionMethod: FormSubmissionType;
  externalSubmissionId?: string;
  responsePayload?: any;
  error?: string;
}
