import { isValidEmail, isValidPhone } from '@nestchat/shared';

export interface ExtractedLeadEntities {
  name?: string;
  phone?: string;
  email?: string;
  businessName?: string;
  businessType?: string;
  websiteType?: string;
  requiredFeatures?: string;
  budget?: string;
  timeline?: string;
}

export class LeadExtractor {
  static extractEntities(query: string): ExtractedLeadEntities {
    const result: ExtractedLeadEntities = {};
    if (!query) return result;

    const trimmed = query.trim();

    // 1. Phone Extraction
    const phoneMatch = trimmed.match(/\b(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/) ||
      trimmed.match(/\b\d{10}\b/);
    if (phoneMatch && isValidPhone(phoneMatch[0])) {
      result.phone = phoneMatch[0];
    }

    // 2. Email Extraction
    const emailMatch = trimmed.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/);
    if (emailMatch && isValidEmail(emailMatch[0])) {
      result.email = emailMatch[0].toLowerCase();
    }

    // 3. Name Extraction
    const nameMatch = trimmed.match(/\b(?:my name is|i am|this is|call me)\s+([A-Za-z]{2,}(?:\s+[A-Za-z]{2,})?)\b/i);
    if (nameMatch && nameMatch[1]) {
      const candidate = nameMatch[1].trim();
      const lowerCandidate = candidate.toLowerCase();
      const forbidden = [
        'looking', 'wanting', 'interested', 'asking', 'here', 'a', 'an', 'the',
        'owner', 'founder', 'from', 'needing', 'trying', 'searching', 'planning',
        'writing', 'calling', 'user', 'visitor', 'customer', 'client', 'business',
        'just', 'not', 'also', 'very', 'quite', 'so', 'manager', 'developer', 'designer'
      ];
      const words = lowerCandidate.split(/\s+/);
      const containsForbidden = words.some(w => forbidden.includes(w));
      if (!containsForbidden && candidate.length >= 2) {
        result.name = candidate;
      }
    }

    // 4. Business Name Extraction
    const bizNameMatch = trimmed.match(/\b(?:i own|my (?:company|business|shop|firm|brand|store) is|company name is|business name is|owner of|from)\s+([A-Za-z0-9\s&'-]{2,30})\b/i);
    if (bizNameMatch && bizNameMatch[1]) {
      const cleanBiz = bizNameMatch[1].replace(/\s*(?:and|we|which|that|located|based).*/i, '').trim();
      if (cleanBiz.length >= 2) {
        result.businessName = cleanBiz;
      }
    }

    // 5. Business Type / Industry Extraction
    const bizTypeMatch = trimmed.match(/\b(?:we manufacture|we sell|we produce|we deal in|we run a|business type is|industry is|business is|field is)\s+([A-Za-z0-9\s&'-]{2,40})\b/i);
    if (bizTypeMatch && bizTypeMatch[1]) {
      const cleanType = bizTypeMatch[1].replace(/\s*(?:and|we|i|need|want).*/i, '').trim();
      if (cleanType.length >= 2) {
        result.businessType = cleanType;
      }
    }

    // 6. Website Type Extraction
    const webTypeMatch = trimmed.match(/\b(?:need|want|looking for|build|create|design|make)\s+(?:a|an)?\s*([A-Za-z0-9\s&'-]*(?:website|web app|e-commerce store|online shop|landing page|portal|app|site))\b/i);
    if (webTypeMatch && webTypeMatch[1]) {
      result.websiteType = webTypeMatch[1].trim();
    } else if (/\b(e-commerce|ecommerce|online store|corporate website|landing page|portfolio website)\b/i.test(trimmed)) {
      const match = trimmed.match(/\b(e-commerce|ecommerce|online store|corporate website|landing page|portfolio website)\b/i);
      if (match) result.websiteType = match[0];
    }

    // 7. Required Features Extraction
    const featuresMatch = trimmed.match(/\b(?:want|need|pages?|features?|including|with)\s+((?:[A-Za-z0-9\s,–-]+\s*)+pages?|\b(?:home|about|products|contact|team|gallery|blog|payment|login|cart|seo|booking|auth)\b[A-Za-z0-9\s,–-]*)\b/i);
    if (featuresMatch && featuresMatch[1]) {
      result.requiredFeatures = featuresMatch[1].trim();
    }

    // 8. Budget Extraction
    const budgetMatch = trimmed.match(/\b(?:budget|cost|price)\s*(?:is|of)?\s*(?:around|approx|about)?\s*([₹$]?\s*\d+(?:,\d+)*(?:\s*k|\s*lakh|\s*thousand|\s*usd|\s*inr)?)\b/i);
    if (budgetMatch && budgetMatch[1]) {
      result.budget = budgetMatch[1].trim();
    }

    // 9. Timeline Extraction
    const timelineMatch = trimmed.match(/\b(?:timeline|timeframe|within|in)\s*(?:is)?\s*(\d+\s*(?:days?|weeks?|months?))\b/i);
    if (timelineMatch && timelineMatch[1]) {
      result.timeline = timelineMatch[1].trim();
    }

    return result;
  }
}
