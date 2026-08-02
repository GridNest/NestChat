import { normalizeQuestion } from '@nestchat/shared';

export type Intent =
  | 'greeting'
  | 'menu'
  | 'booking'
  | 'pricing'
  | 'sales_intent'
  | 'contact'
  | 'faq'
  | 'complaint'
  | 'location'
  | 'products'
  | 'services'
  | 'hours'
  | 'events'
  | 'career'
  | 'support'
  | 'human_agent'
  | 'gallery'
  | 'order'
  | 'delivery'
  | 'offers'
  | 'about'
  | 'unknown';

export interface IntentResult {
  intent: Intent;
  confidence: number;
  subIntent?: string;
}

const INTENT_PATTERNS: Record<Intent, RegExp[]> = {
  greeting: [
    /^(hi|hello|hey|namaste|namaskar|good morning|good evening|good afternoon|howdy|yo|sup)\b/i,
    /^(hola|bonjour|konnichiwa|ni hao|annyeong|ola)\b/i,
  ],
  sales_intent: [
    /\b(need website|website development|website design|build (a )?website|create (a )?website|web dev|web design|website quote|cost of website|custom website|redesign website|make a website)\b/i,
    /\b(pricing|cost|package|quote|estimate|consultation|proposal|get quote|request quote|price estimate|cost estimate|consulting)\b/i,
  ],
  menu: [
    /\b(menu|catalog|catalogue|product list|item list|what (do you (have|offer|sell)|is on the menu)|show (me )?(your )?(menu|products|services|items|catalog))\b/i,
    /\b(breakfast|lunch|dinner|dessert|drink|beverage|main course|food items|dish|cuisine)\b/i,
  ],
  booking: [
    /\b(book|reservation|reserve|table|booking|appointment|schedule|seat|party of|cabinet|slot)\b/i,
    /\b(i want to (book|reserve)|can i (book|reserve)|how (do|can) i (book|reserve))\b/i,
  ],
  pricing: [
    /\b(price|cost|rate|fee|charges?|pricing|how much|what (is )?(the )?(price|cost|rate)|afford|budget|cheap|expensive|pay|payment|rupees?|dollars?|rs\.?|₹|\$)\b/i,
  ],
  contact: [
    /\b(contact|phone|mobile|cell|telephone|whatsapp|email|reach|call|message us|get in touch|support@|info@)\b/i,
  ],
  faq: [
    /^(faq|faqs|frequently asked questions|questions|common questions)\b/i,
    /\b(i have a question|ask a question|query|doubt)\b/i,
  ],
  complaint: [
    /\b(complaint|issue|problem|not happy|dissatisfied|bad experience|poor service|refund|return|cancel order)\b/i,
  ],
  location: [
    /\b(location|address|where (are you|is it)|direction|map|find us|reach us|area|neighborhood|city|town|street|situated|located)\b/i,
  ],
  products: [
    /\b(product|item|goods|merchandise|collection|catalog|catalogue|inventory|stock|available|variety|range|types?|kinds?)\b/i,
  ],
  services: [
    /\b(service|offer|provide|facility|amenities|what (do|can) (you|we) (offer|provide|do)|solutions)\b/i,
  ],
  hours: [
    /\b(hours?|timing|open|close|opening|closing|working hours?|business hours?|when (do|are) you (open|close)|what time|operating)\b/i,
  ],
  events: [
    /\b(event|party|celebration|wedding|reception|function|gathering|concert|live music|djs?|performance|show|upcoming)\b/i,
  ],
  career: [
    /\b(job|career|vacancy|hiring|recruit|employment|work with us|join our team|opening|position|apply)\b/i,
  ],
  support: [
    /\b(support|help|assistance|help me|can you help|i need|problem with|trouble|issue with|not working)\b/i,
  ],
  human_agent: [
    /\b(human|agent|real person|talk to|speak to|connect (me )?to|transfer|handover|real agent|live person|customer service|customer care)\b/i,
  ],
  gallery: [
    /\b(gallery|photo|picture|image|video|tour|view|look|visual|see|show me|photos?|images?|album)\b/i,
  ],
  order: [
    /\b(order|place order|i want to order|can i order|online order|takeaway|take away|parcel|delivery order)\b/i,
  ],
  delivery: [
    /\b(delivery|home delivery|doorstep|courier|ship|shipping|dispatch|deliver|receive|get it delivered)\b/i,
  ],
  offers: [
    /\b(offer|deal|discount|coupon|promo|promotion|special offer|combo|package|save|sale|flat off|percentage off)\b/i,
  ],
  about: [
    /\b(about|who (are|is)|tell me about|about us|about you|tell me more|introduce yourself|yourself|background|history|story|why (should|choose))\b/i,
  ],
  unknown: [],
};

const RESUME_KEYWORDS = [
  'continue',
  'resume',
  'book table',
  'booking',
  'table booking',
  'room booking',
  'table reservation',
  'reservation',
  'appointment',
  'continue booking',
  'proceed',
  'yes',
  'haan',
  'sure',
  'okay',
  'ok',
  'theek hai',
  'let\'s continue',
  'back to booking',
  'back to inquiry',
  'go on',
  'continue form',
  'website',
  'website development',
  'website design',
  'quote',
  'estimate',
  'consultation',
];

export class IntentDetector {
  static detect(query: string, language: string): IntentResult {
    const normalized = normalizeQuestion(query);
    const lower = normalized.toLowerCase();

    let bestIntent: Intent = 'unknown';
    let bestScore = 0;
    let subIntent: string | undefined;

    for (const [intent, patterns] of Object.entries(INTENT_PATTERNS)) {
      let score = 0;
      for (const pattern of patterns) {
        if (pattern.test(lower)) {
          score += 0.4 + (lower.match(pattern)?.length || 1) * 0.1;

          if (intent === 'menu') {
            const match = lower.match(pattern);
            if (match) {
              const matchedText = match[0].toLowerCase();
              const menuSubIntents = ['breakfast', 'lunch', 'dinner', 'dessert', 'drink', 'beverage', 'appetizer', 'main course', 'special', 'snack'];
              for (const sub of menuSubIntents) {
                if (matchedText.includes(sub) || lower.includes(sub)) {
                  subIntent = sub;
                  break;
                }
              }
            }
          }
        }
      }

      if (score > bestScore) {
        bestScore = score;
        bestIntent = intent as Intent;
      }
    }

    if (bestScore < 0.3) {
      const hindiGreetings = ['namaste', 'namaskar', 'kaise ho', 'kya haal', 'hello ji', 'ji namaste'];
      for (const g of hindiGreetings) {
        if (lower.includes(g)) {
          bestIntent = 'greeting';
          bestScore = 0.8;
          break;
        }
      }
    }

    return {
      intent: bestIntent,
      confidence: Math.min(bestScore + 0.2, 1),
      subIntent,
    };
  }

  static isResumeRequest(query: string): boolean {
    const lower = query.toLowerCase().trim();
    return RESUME_KEYWORDS.some(k => lower === k || lower.startsWith(k));
  }

  static getIntentLabel(intent: Intent, language: string): string {
    const labels: Record<string, { en: string; hi: string }> = {
      greeting: { en: 'Greeting', hi: 'Abhivadan' },
      menu: { en: 'Menu', hi: 'Menu' },
      booking: { en: 'Booking', hi: 'Booking' },
      pricing: { en: 'Pricing', hi: 'Keemat' },
      sales_intent: { en: 'Sales Inquiry', hi: 'Bikri Inquiry' },
      contact: { en: 'Contact', hi: 'Sampark' },
      faq: { en: 'FAQ', hi: 'Sawal' },
      complaint: { en: 'Complaint', hi: 'Shikayat' },
      location: { en: 'Location', hi: 'Sthan' },
      products: { en: 'Products', hi: 'Utpad' },
      services: { en: 'Services', hi: 'Sevayein' },
      hours: { en: 'Hours', hi: 'Samay' },
      events: { en: 'Events', hi: 'Karyakram' },
      career: { en: 'Career', hi: 'Naukri' },
      support: { en: 'Support', hi: 'Sahayata' },
      human_agent: { en: 'Human Agent', hi: 'Vyakti' },
      gallery: { en: 'Gallery', hi: 'Gallery' },
      order: { en: 'Order', hi: 'Order' },
      delivery: { en: 'Delivery', hi: 'Delivery' },
      offers: { en: 'Offers', hi: 'Prastav' },
      about: { en: 'About', hi: 'Baare Mein' },
      unknown: { en: 'General', hi: 'Sadharan' },
    };
    const label = labels[intent] || labels.unknown;
    return language === 'hi' ? label.hi : label.en;
  }
}
