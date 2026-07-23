import { REGEX } from '../constants/regex';

export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any) => string | null;
}

export interface ValidationErrors {
  [field: string]: string;
}

export function validateField(value: any, rules: ValidationRule): string | null {
  if (rules.required && (value === undefined || value === null || value === '')) {
    return 'This field is required';
  }

  if (value !== undefined && value !== null && value !== '') {
    if (rules.minLength && typeof value === 'string' && value.length < rules.minLength) {
      return `Minimum ${rules.minLength} characters required`;
    }

    if (rules.maxLength && typeof value === 'string' && value.length > rules.maxLength) {
      return `Maximum ${rules.maxLength} characters allowed`;
    }

    if (rules.pattern && typeof value === 'string' && !rules.pattern.test(value)) {
      return 'Invalid format';
    }

    if (rules.custom) {
      return rules.custom(value);
    }
  }

  return null;
}

export function validateEmail(email: string): string | null {
  if (!email) return 'Email is required';
  if (!REGEX.email.test(email)) return 'Invalid email format';
  return null;
}

export function validatePhone(phone: string): string | null {
  if (!phone) return 'Phone number is required';
  if (!REGEX.phone.test(phone)) return 'Invalid phone number format';
  return null;
}

export function validateRequired(value: any, fieldName: string): string | null {
  if (!value || (typeof value === 'string' && value.trim() === '')) {
    return `${fieldName} is required`;
  }
  return null;
}

export function validateData(data: Record<string, any>, rules: Record<string, ValidationRule>): ValidationErrors {
  const errors: ValidationErrors = {};

  Object.entries(rules).forEach(([field, rule]) => {
    const error = validateField(data[field], rule);
    if (error) {
      errors[field] = error;
    }
  });

  return errors;
}

export function sanitizeString(str: string): string {
  return str
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}
