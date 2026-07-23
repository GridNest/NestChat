export const REGEX = {
  email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  phone: /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,4}[-\s\.]?[0-9]{1,9}$/,
  url: /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/,
  mongoId: /^[0-9a-fA-F]{24}$/,
  slug: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
} as const;

export function isValidEmail(email: string): boolean {
  return REGEX.email.test(email);
}

export function isValidPhone(phone: string): boolean {
  return REGEX.phone.test(phone);
}

export function isValidMongoId(id: string): boolean {
  return REGEX.mongoId.test(id);
}

export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
