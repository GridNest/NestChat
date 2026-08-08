import { ClientFormService } from '../clientForm.service.js';
import { HtmlFormAdapter } from './adapters/htmlFormAdapter.js';
import { ApiFormAdapter } from './adapters/apiFormAdapter.js';
import { WordPressAdapter } from './adapters/wordPressAdapter.js';
import { WebhookAdapter } from './adapters/webhookAdapter.js';
import { ClientForm, FormSubmissionResult } from '@nestchat/shared';
import { logger } from '../../../utils/logger.js';

export class FormSubmissionService {
  /**
   * Submits collected conversational lead data to the target client website form.
   */
  static async submitLeadToClientForm(
    clientId: string,
    conversationalData: Record<string, any>,
    preferredFormId?: string
  ): Promise<FormSubmissionResult> {
    try {
      const forms = await ClientFormService.getClientForms(clientId);
      if (!forms || forms.length === 0) {
        logger.info(`[FormSubmissionService] No client website forms configured for ${clientId}. Using NestChat inquiry fallback.`);
        return {
          success: false,
          submissionStatus: 'fallback',
          submissionMethod: 'unsupported',
          error: 'No active external website form configured for this client',
        };
      }

      // Find target form: preferredFormId > primary active form > first active form
      let targetForm = forms.find(f => f.formId === preferredFormId && f.isActive);
      if (!targetForm) {
        targetForm = forms.find(f => f.isActive && f.isPrimary) || forms.find(f => f.isActive);
      }

      if (!targetForm) {
        return {
          success: false,
          submissionStatus: 'fallback',
          submissionMethod: 'unsupported',
          error: 'All configured website forms for this client are currently inactive',
        };
      }

      // Map conversational data to form field keys
      const mappedPayload = this.buildPayloadForForm(targetForm, conversationalData);

      // Select submission adapter
      return await this.dispatchToAdapter(targetForm, mappedPayload);
    } catch (err) {
      logger.error(`[FormSubmissionService] Unhandled error during submission:`, err);
      return {
        success: false,
        submissionStatus: 'fallback',
        submissionMethod: 'unsupported',
        error: (err as Error).message,
      };
    }
  }

  /**
   * Preview mapping and payload for Admin test tool without executing real external submission.
   */
  static async previewSubmission(clientId: string, formId: string, sampleData: Record<string, any>) {
    const form = await ClientFormService.getClientFormById(clientId, formId);
    const mappedPayload = this.buildPayloadForForm(form, sampleData);

    return {
      formId: form.formId,
      formName: form.formName,
      pageUrl: form.pageUrl,
      action: form.action,
      method: form.method,
      submissionType: form.submissionType,
      configuredFieldsCount: form.fields.length,
      sampleInput: sampleData,
      mappedPayload,
      readyForSubmission: Object.keys(mappedPayload).length > 0,
    };
  }

  /**
   * Map conversational data keys (visitor.name, visitor.email, etc.) to target form field names.
   */
  private static buildPayloadForForm(form: ClientForm, data: Record<string, any>): Record<string, any> {
    const payload: Record<string, any> = {};
    const unmappedInfo: string[] = [];

    // Canonical key lookup map
    const sourceMap: Record<string, any> = {
      'visitor.name': data.fullName || data.name || data.visitorName || data['visitor.name'],
      'visitor.email': data.email || data.visitorEmail || data['visitor.email'],
      'visitor.phone': data.phone || data.mobile || data.visitorPhone || data['visitor.phone'],
      'visitor.message': data.message || data.details || data.requirement || data['visitor.message'],
      'visitor.company': data.company || data.businessName || data['visitor.company'],
      'visitor.subject': data.subject || data.originalQuestion || data['visitor.subject'],
      'visitor.date': data.date || data.bookingDate || data['visitor.date'],
      'visitor.guests': data.guests || data.partySize || data['visitor.guests'],
      'visitor.occasion': data.occasion || data['visitor.occasion'],
      'visitor.budget': data.budget || data['visitor.budget'],
      'visitor.address': data.address || data['visitor.address'],
      'visitor.service': data.service || data.serviceType || data['visitor.service'],
    };

    let hasMessageField = false;
    let messageFieldName = '';

    for (const field of form.fields) {
      if (field.mappedTo === 'visitor.message') {
        hasMessageField = true;
        messageFieldName = field.fieldName;
      }

      if (field.mappedTo && field.mappedTo !== 'visitor.custom' && sourceMap[field.mappedTo] !== undefined) {
        payload[field.fieldName] = sourceMap[field.mappedTo];
      } else if (field.customKey && data[field.customKey] !== undefined) {
        payload[field.fieldName] = data[field.customKey];
      } else if (data[field.fieldName] !== undefined) {
        payload[field.fieldName] = data[field.fieldName];
      }
    }

    // Always include canonical alias keys for backend APIs that expect standard names (name vs fullName)
    if (payload.fullName && !payload.name) {
      payload.name = payload.fullName;
    }
    if (payload.name && !payload.fullName) {
      payload.fullName = payload.name;
    }

    // Dynamic location field fallbacks (only if client form actually defines country/state fields)
    const hasCountryField = form.fields.some(f => f.fieldName.toLowerCase() === 'country');
    const hasStateField = form.fields.some(f => f.fieldName.toLowerCase() === 'state');
    if (hasCountryField && !payload.country) payload.country = data.country || 'India';
    if (hasStateField && !payload.state) payload.state = data.state || 'Uttar Pradesh';

    // Normalize phone number to clean digits if present
    if (payload.phone) {
      const cleanPhone = String(payload.phone).replace(/[^0-9]/g, '');
      if (cleanPhone.length >= 10) {
        payload.phone = cleanPhone.slice(-10);
      }
    }

    // Dynamic service field normalization (if client form has a service field)
    const hasServiceField = form.fields.some(f => f.fieldName.toLowerCase().includes('service') || f.mappedTo === 'visitor.service');
    if (hasServiceField && payload.service) {
      let rawService = String(payload.service).toLowerCase();
      const validServices = ['hotel', 'restaurant', 'corporate', 'seo', 'maintenance', 'template', 'other'];
      if (!validServices.includes(rawService)) {
        if (rawService.includes('hotel')) rawService = 'hotel';
        else if (rawService.includes('restaurant')) rawService = 'restaurant';
        else if (rawService.includes('seo')) rawService = 'seo';
        else if (rawService.includes('maintenance')) rawService = 'maintenance';
        else if (rawService.includes('template')) rawService = 'template';
        else if (rawService.includes('website') || rawService.includes('corporate')) rawService = 'corporate';
        else rawService = 'other';
      }
      payload.service = rawService;
    }

    // Ensure honeypot is empty so bot detectors pass
    if ('honeypot' in payload) {
      payload.honeypot = '';
    }

    // Put extra details into message field if target form doesn't have explicit fields for them
    for (const [key, val] of Object.entries(data)) {
      if (!val) continue;
      const isMapped = form.fields.some(f => f.fieldName === key || (f.mappedTo && sourceMap[f.mappedTo] === val));
      if (!isMapped && key !== 'workflowType' && key !== 'clientId' && key !== 'chatId') {
        unmappedInfo.push(`${key}: ${val}`);
      }
    }

    if (unmappedInfo.length > 0 && hasMessageField && messageFieldName) {
      const existingMsg = payload[messageFieldName] || '';
      payload[messageFieldName] = `${existingMsg}\n[Additional Info: ${unmappedInfo.join(', ')}]`.trim();
    }

    return payload;
  }

  /**
   * Route submission payload to the target adapter.
   */
  private static async dispatchToAdapter(form: ClientForm, payload: Record<string, any>): Promise<FormSubmissionResult> {
    switch (form.submissionType) {
      case 'html_form':
        return HtmlFormAdapter.submit(form, payload);
      case 'api_endpoint':
        return ApiFormAdapter.submit(form, payload);
      case 'wordpress':
        return WordPressAdapter.submit(form, payload);
      case 'webhook':
        return WebhookAdapter.submit(form, payload);
      case 'unsupported':
      default:
        logger.info(`[FormSubmissionService] Form ${form.formId} submissionType is unsupported. Falling back.`);
        return {
          success: false,
          submissionStatus: 'fallback',
          submissionMethod: 'unsupported',
          error: 'Automatic submission is unsupported for this form type',
        };
    }
  }
}
