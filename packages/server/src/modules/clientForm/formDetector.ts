import { ClientForm, ClientFormField, FormFieldType, FormMappingTarget, FormType, FormSubmissionType } from '@nestchat/shared';
import { logger } from '../../utils/logger.js';

export class FormDetector {
  /**
   * Scans HTML string of a web page and extracts all detected forms.
   */
  static extractFormsFromHtml(html: string, pageUrl: string, clientId: string): ClientForm[] {
    const forms: ClientForm[] = [];

    if (!html || typeof html !== 'string' || html.length < 50) {
      return forms;
    }

    try {
      // Regex to find all <form ...> ... </form> blocks
      const formRegex = /<form\b([^>]*)>([\s\S]*?)<\/form>/gi;
      let formMatch: RegExpExecArray | null;
      let formIndex = 1;

      while ((formMatch = formRegex.exec(html)) !== null) {
        const formAttributes = formMatch[1] || '';
        const formInnerHtml = formMatch[2] || '';

        // Extract attributes: action, method, id, name, class
        const actionMatch = formAttributes.match(/action=["']([^"']*)["']/i);
        const methodMatch = formAttributes.match(/method=["']([^"']*)["']/i);
        const idMatch = formAttributes.match(/id=["']([^"']*)["']/i);
        const nameMatch = formAttributes.match(/name=["']([^"']*)["']/i);
        const classMatch = formAttributes.match(/class=["']([^"']*)["']/i);

        const formIdAttr = idMatch ? idMatch[1].trim() : (nameMatch ? nameMatch[1].trim() : `form_${formIndex}`);
        const actionAttr = actionMatch ? actionMatch[1].trim() : pageUrl;
        const methodAttr = (methodMatch ? methodMatch[1].toUpperCase() : 'POST') as 'GET' | 'POST';

        // Resolve absolute action URL
        let resolvedAction = actionAttr;
        try {
          if (actionAttr && !actionAttr.startsWith('http') && !actionAttr.startsWith('//')) {
            resolvedAction = new URL(actionAttr, pageUrl).toString();
          } else if (actionAttr.startsWith('//')) {
            resolvedAction = `https:${actionAttr}`;
          }
        } catch {
          resolvedAction = pageUrl;
        }

        const fields = this.extractFieldsFromForm(formInnerHtml);

        // Filter out empty forms or forms with no actionable inputs
        const nonSubmitFields = fields.filter(f => f.type !== 'hidden');
        if (nonSubmitFields.length === 0) {
          continue;
        }

        // Determine Form Type
        const formType = this.detectFormType(fields, formInnerHtml, formAttributes, pageUrl);

        // Determine Form Name
        const formName = this.detectFormName(formAttributes, formInnerHtml, formType, formIndex);

        // Determine Submission Type (e.g. WordPress, HTML form, Webhook)
        const submissionType = this.detectSubmissionType(resolvedAction, formInnerHtml, classMatch ? classMatch[1] : '');

        const formId = `${clientId}_${formIdAttr.replace(/[^a-zA-Z0-9_-]/g, '_')}_${formIndex}`;

        forms.push({
          clientId,
          formId,
          formName,
          pageUrl,
          action: resolvedAction,
          method: methodAttr,
          fields,
          formType,
          isActive: true,
          isPrimary: formIndex === 1,
          lastScanned: new Date(),
          submissionType,
          submissionEndpoint: resolvedAction,
        });

        formIndex++;
      }
    } catch (err) {
      logger.warn(`[FormDetector] Error extracting forms from ${pageUrl}:`, err);
    }

    return forms;
  }

  /**
   * Extract inputs, textareas, selects, and buttons from inner form HTML.
   */
  private static extractFieldsFromForm(formHtml: string): ClientFormField[] {
    const fields: ClientFormField[] = [];
    const seenNames = new Set<string>();

    // 1. Inputs (<input ...>)
    const inputRegex = /<input\b([^>]*)>/gi;
    let match: RegExpExecArray | null;

    while ((match = inputRegex.exec(formHtml)) !== null) {
      const attrs = match[1];
      const typeMatch = attrs.match(/type=["']([^"']*)["']/i);
      const nameMatch = attrs.match(/name=["']([^"']*)["']/i);
      const idMatch = attrs.match(/id=["']([^"']*)["']/i);
      const placeholderMatch = attrs.match(/placeholder=["']([^"']*)["']/i);
      const isRequired = /\brequired\b/i.test(attrs);

      const typeRaw = typeMatch ? typeMatch[1].toLowerCase() : 'text';
      if (['submit', 'button', 'image', 'reset'].includes(typeRaw)) continue;

      const fieldName = nameMatch ? nameMatch[1].trim() : (idMatch ? idMatch[1].trim() : `field_${fields.length + 1}`);
      if (!fieldName || seenNames.has(fieldName.toLowerCase())) continue;
      seenNames.add(fieldName.toLowerCase());

      const fieldId = idMatch ? idMatch[1].trim() : fieldName;
      const placeholder = placeholderMatch ? placeholderMatch[1].trim() : '';

      const label = this.findLabelForField(formHtml, fieldId, fieldName, placeholder, match.index);
      const fieldType = this.normalizeFieldType(typeRaw, fieldName, label);
      const mappedTo = this.autoMapField(fieldName, label, fieldType);

      fields.push({
        fieldId,
        fieldName,
        label,
        type: fieldType,
        required: isRequired,
        placeholder,
        mappedTo,
      });
    }

    // 2. Textareas (<textarea ...> ... </textarea>)
    const textareaRegex = /<textarea\b([^>]*)>([\s\S]*?)<\/textarea>/gi;
    while ((match = textareaRegex.exec(formHtml)) !== null) {
      const attrs = match[1];
      const nameMatch = attrs.match(/name=["']([^"']*)["']/i);
      const idMatch = attrs.match(/id=["']([^"']*)["']/i);
      const placeholderMatch = attrs.match(/placeholder=["']([^"']*)["']/i);
      const isRequired = /\brequired\b/i.test(attrs);

      const fieldName = nameMatch ? nameMatch[1].trim() : (idMatch ? idMatch[1].trim() : `textarea_${fields.length + 1}`);
      if (!fieldName || seenNames.has(fieldName.toLowerCase())) continue;
      seenNames.add(fieldName.toLowerCase());

      const fieldId = idMatch ? idMatch[1].trim() : fieldName;
      const placeholder = placeholderMatch ? placeholderMatch[1].trim() : '';
      const label = this.findLabelForField(formHtml, fieldId, fieldName, placeholder, match.index);
      const mappedTo = this.autoMapField(fieldName, label, 'textarea');

      fields.push({
        fieldId,
        fieldName,
        label,
        type: 'textarea',
        required: isRequired,
        placeholder,
        mappedTo,
      });
    }

    // 3. Selects (<select ...> ... </select>)
    const selectRegex = /<select\b([^>]*)>([\s\S]*?)<\/select>/gi;
    while ((match = selectRegex.exec(formHtml)) !== null) {
      const attrs = match[1];
      const innerSelect = match[2];
      const nameMatch = attrs.match(/name=["']([^"']*)["']/i);
      const idMatch = attrs.match(/id=["']([^"']*)["']/i);
      const isRequired = /\brequired\b/i.test(attrs);

      const fieldName = nameMatch ? nameMatch[1].trim() : (idMatch ? idMatch[1].trim() : `select_${fields.length + 1}`);
      if (!fieldName || seenNames.has(fieldName.toLowerCase())) continue;
      seenNames.add(fieldName.toLowerCase());

      const fieldId = idMatch ? idMatch[1].trim() : fieldName;
      const label = this.findLabelForField(formHtml, fieldId, fieldName, '', match.index);

      // Extract options
      const options: string[] = [];
      const optionRegex = /<option\b[^>]*>([^<]*)<\/option>/gi;
      let optMatch: RegExpExecArray | null;
      while ((optMatch = optionRegex.exec(innerSelect)) !== null) {
        const val = optMatch[1].trim();
        if (val && !val.toLowerCase().includes('select') && !val.toLowerCase().includes('choose')) {
          options.push(val);
        }
      }

      const mappedTo = this.autoMapField(fieldName, label, 'select');

      fields.push({
        fieldId,
        fieldName,
        label,
        type: 'select',
        required: isRequired,
        options,
        mappedTo,
      });
    }

    return fields;
  }

  /**
   * Find label text for a specific field.
   */
  private static findLabelForField(formHtml: string, fieldId: string, fieldName: string, placeholder: string, tagIndex: number): string {
    // Check for explicit <label for="fieldId"> Label Text </label>
    if (fieldId) {
      const labelForRegex = new RegExp(`<label\\b[^>]*for=["']${fieldId}["'][^>]*>([\\s\\S]*?)<\\/label>`, 'i');
      const labelForMatch = formHtml.match(labelForRegex);
      if (labelForMatch && labelForMatch[1]) {
        const clean = labelForMatch[1].replace(/<[^>]+>/g, '').trim();
        if (clean.length > 0) return clean;
      }
    }

    // Check preceding text snippet (up to 120 chars before input tag)
    const startIdx = Math.max(0, tagIndex - 120);
    const precedingSnippet = formHtml.substring(startIdx, tagIndex);
    const labelMatch = precedingSnippet.match(/<label\b[^>]*>([^<]+)<\/label>/i);
    if (labelMatch && labelMatch[1].trim()) {
      return labelMatch[1].trim();
    }

    // Fallback to placeholder if descriptive
    if (placeholder && placeholder.length > 1) {
      return placeholder;
    }

    // Fallback to cleaned field name
    return fieldName.replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }

  /**
   * Normalize input type to standard FormFieldType.
   */
  private static normalizeFieldType(typeRaw: string, fieldName: string, label: string): FormFieldType {
    const fn = fieldName.toLowerCase();
    const lb = label.toLowerCase();

    if (typeRaw === 'email' || fn.includes('email') || lb.includes('email')) return 'email';
    if (typeRaw === 'tel' || fn.includes('phone') || fn.includes('mobile') || fn.includes('tel') || lb.includes('phone') || lb.includes('mobile')) return 'tel';
    if (typeRaw === 'number' || fn.includes('guest') || fn.includes('quantity') || lb.includes('guests')) return 'number';
    if (typeRaw === 'date' || fn.includes('date') || lb.includes('date')) return 'date';
    if (typeRaw === 'time' || fn.includes('time') || lb.includes('time')) return 'time';
    if (typeRaw === 'checkbox') return 'checkbox';
    if (typeRaw === 'radio') return 'radio';
    if (typeRaw === 'textarea') return 'textarea';
    if (typeRaw === 'hidden') return 'hidden';

    return 'text';
  }

  /**
   * Auto-map form fields to standard NestChat visitor targets.
   */
  private static autoMapField(fieldName: string, label: string, type: FormFieldType): FormMappingTarget {
    const combined = `${fieldName} ${label}`.toLowerCase();

    if (type === 'email' || combined.includes('email') || combined.includes('e-mail')) {
      return 'visitor.email';
    }
    if (type === 'tel' || combined.includes('phone') || combined.includes('mobile') || combined.includes('contact number') || combined.includes('whatsapp')) {
      return 'visitor.phone';
    }
    if (combined.includes('name') && !combined.includes('company') && !combined.includes('business')) {
      return 'visitor.name';
    }
    if (combined.includes('message') || combined.includes('details') || combined.includes('comment') || combined.includes('requirement') || combined.includes('inquiry') || type === 'textarea') {
      return 'visitor.message';
    }
    if (combined.includes('subject') || combined.includes('topic')) {
      return 'visitor.subject';
    }
    if (combined.includes('company') || combined.includes('business') || combined.includes('organization')) {
      return 'visitor.company';
    }
    if (combined.includes('date') || combined.includes('checkin') || combined.includes('booking')) {
      return 'visitor.date';
    }
    if (combined.includes('guest') || combined.includes('people') || combined.includes('pax') || combined.includes('party')) {
      return 'visitor.guests';
    }
    if (combined.includes('occasion') || combined.includes('event')) {
      return 'visitor.occasion';
    }
    if (combined.includes('budget') || combined.includes('cost') || combined.includes('price')) {
      return 'visitor.budget';
    }
    if (combined.includes('address') || combined.includes('city') || combined.includes('location')) {
      return 'visitor.address';
    }

    return 'visitor.custom';
  }

  /**
   * Identify purpose / category of the detected form.
   */
  private static detectFormType(fields: ClientFormField[], formHtml: string, formAttrs: string, pageUrl: string): FormType {
    const text = `${formAttrs} ${formHtml} ${pageUrl}`.toLowerCase();
    const fieldNames = fields.map(f => `${f.fieldName} ${f.label}`).join(' ').toLowerCase();

    if (text.includes('reservation') || fieldNames.includes('guest') || fieldNames.includes('party') || text.includes('table')) {
      return 'reservation';
    }
    if (text.includes('booking') || fieldNames.includes('checkin') || fieldNames.includes('room')) {
      return 'booking';
    }
    if (text.includes('quote') || fieldNames.includes('budget') || text.includes('estimate')) {
      return 'quote';
    }
    if (text.includes('newsletter') || (fields.length === 1 && fields[0].type === 'email')) {
      return 'newsletter';
    }
    if (text.includes('contact') || fieldNames.includes('message') || fieldNames.includes('subject')) {
      return 'contact';
    }

    return 'inquiry';
  }

  /**
   * Generate human readable name for detected form.
   */
  private static detectFormName(formAttrs: string, formHtml: string, formType: FormType, index: number): string {
    const idMatch = formAttrs.match(/id=["']([^"']*)["']/i);
    const nameMatch = formAttrs.match(/name=["']([^"']*)["']/i);

    if (idMatch && idMatch[1]) {
      const clean = idMatch[1].replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      if (clean.length > 2) return clean;
    }

    if (nameMatch && nameMatch[1]) {
      const clean = nameMatch[1].replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      if (clean.length > 2) return clean;
    }

    const typeTitle = formType.charAt(0).toUpperCase() + formType.slice(1);
    return `${typeTitle} Form ${index > 1 ? index : ''}`.trim();
  }

  /**
   * Determine submission mechanism type.
   */
  private static detectSubmissionType(actionUrl: string, formHtml: string, formClass: string): FormSubmissionType {
    const combined = `${actionUrl} ${formHtml} ${formClass}`.toLowerCase();

    if (combined.includes('wp-admin/admin-ajax.php') || combined.includes('wpcf7') || combined.includes('wpforms') || combined.includes('elementor-form')) {
      return 'wordpress';
    }

    if (actionUrl.includes('/api/') || actionUrl.includes('webhook') || actionUrl.includes('zapier') || actionUrl.includes('make.com')) {
      return 'api_endpoint';
    }

    return 'html_form';
  }
}
