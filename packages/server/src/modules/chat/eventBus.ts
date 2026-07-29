import { BotResponse } from './responseEngine.js';
import { analyticsService } from '../analytics/analytics.service.js';
import { UnansweredService } from '../unanswered/unanswered.service.js';
import { ChatMessageModel } from './chatMessage.model.js';
import { logger } from '../../utils/logger.js';

// ─── Thresholds ───────────────────────────────────────────────────────────────

export const CONFIDENCE_HIGH    = 0.70;  // ≥ 0.70 → answer directly
export const CONFIDENCE_MEDIUM  = 0.40;  // 0.40–0.69 → answer with caution
export const CONFIDENCE_LOW     = 0.40;  // < 0.40 → trigger inquiry

// ─── Types ───────────────────────────────────────────────────────────────────

export type ConfidenceTier = 'high' | 'medium' | 'low';

export interface EventContext {
  clientId: string;
  chatId: string;
  sessionId: string;
  visitorId: string;
  language: string;
  question: string;        // The original visitor question
  botMessageId?: string;   // MongoDB _id of the saved ChatMessage
  botResponse: BotResponse;
  responseTimeMs: number;
  intent?: string;         // Detected intent (e.g. pricing, menu, booking)
  retrievedChunkIds?: string[]; // RAG chunk IDs used
  isInquiryMode?: boolean; // True if already in inquiry step flow
  inquiryCreated?: boolean; // True if an Inquiry record was just created
  originalQuestion?: string; // The trigger question before inquiry flow
}

// ─── Intent / Topic Categorization ───────────────────────────────────────────

const TOPIC_PATTERNS: Array<{ pattern: RegExp; topic: string; category: string }> = [
  { pattern: /\b(price|cost|rate|fee|charge|pricing|plan|package)\b/i, topic: 'Pricing Inquiry', category: 'pricing' },
  { pattern: /\b(menu|food|dish|eat|order|breakfast|lunch|dinner|dessert|drink|beverage)\b/i, topic: 'Menu Inquiry', category: 'menu' },
  { pattern: /\b(contact|phone|email|address|location|reach|call)\b/i, topic: 'Contact Information', category: 'contact' },
  { pattern: /\b(hour|timing|open|close|working|schedule|available)\b/i, topic: 'Business Hours', category: 'hours' },
  { pattern: /\b(service|offer|provide|solution|help|support)\b/i, topic: 'Service Inquiry', category: 'services' },
  { pattern: /\b(book|reservation|appointment|slot|schedule)\b/i, topic: 'Booking Request', category: 'booking' },
  { pattern: /\b(deliver|shipping|ship|courier)\b/i, topic: 'Delivery Inquiry', category: 'delivery' },
  { pattern: /\b(return|refund|cancel|exchange|policy)\b/i, topic: 'Policy Inquiry', category: 'policy' },
  { pattern: /\b(product|item|stock|available|catalogue)\b/i, topic: 'Product Inquiry', category: 'products' },
  { pattern: /\b(about|company|team|background|who are|founded|history)\b/i, topic: 'About Business', category: 'about' },
];

function extractTopic(text: string): { topic: string; category: string } {
  const lower = text.toLowerCase();
  for (const { pattern, topic, category } of TOPIC_PATTERNS) {
    if (pattern.test(lower)) return { topic, category };
  }
  return { topic: 'General Inquiry', category: 'general' };
}

// ─── Confidence Tier ─────────────────────────────────────────────────────────

export function getConfidenceTier(score: number): ConfidenceTier {
  if (score >= CONFIDENCE_HIGH) return 'high';
  if (score >= CONFIDENCE_MEDIUM) return 'medium';
  return 'low';
}

/**
 * Determine why the question went unanswered — used for Unanswered tracking.
 */
function classifyUnansweredReason(
  response: BotResponse,
  confidence: number
): UnansweredReason {
  const type = response.metadata?.matchedType;

  if (type === 'unknown' && confidence === 0) {
    return 'knowledge_not_found';
  }
  if (confidence > 0 && confidence < CONFIDENCE_LOW) {
    return 'low_confidence';
  }
  if (type === 'unknown') {
    return 'low_similarity';
  }
  return 'model_uncertain';
}

type UnansweredReason = 'knowledge_not_found' | 'low_similarity' | 'empty_knowledge_base' | 'model_uncertain' | 'low_confidence';

// ─── EventBus ─────────────────────────────────────────────────────────────────

export class EventBus {
  /**
   * Central event processor — called once per bot response in chat.service.ts.
   * Handles all analytics, unanswered tracking, and message metadata updates.
   * All calls are fire-and-forget (non-blocking to the visitor response).
   */
  static async process(ctx: EventContext): Promise<void> {
    // Run all tracking in parallel — failures are isolated and logged
    const tasks: Promise<void>[] = [
      this.updateAnalytics(ctx),
      this.trackUnanswered(ctx),
      this.enrichMessageMetadata(ctx),
    ];

    const results = await Promise.allSettled(tasks);

    results.forEach((result, idx) => {
      if (result.status === 'rejected') {
        logger.warn(`[EventBus] Task ${idx} failed:`, result.reason);
      }
    });
  }

  // ─── Analytics Update ───────────────────────────────────────────────────────

  private static async updateAnalytics(ctx: EventContext): Promise<void> {
    const confidence = ctx.botResponse.metadata?.confidence ?? 0;
    const matchedType = ctx.botResponse.metadata?.matchedType;
    const isAnswered = matchedType !== 'unknown' && !ctx.botResponse.triggerInquiry;
    const isFallback = !!ctx.botResponse.triggerInquiry || matchedType === 'unknown';
    const { topic, category } = extractTopic(ctx.question);

    await analyticsService.trackMessage({
      clientId: ctx.clientId,
      responseTimeMs: ctx.responseTimeMs,
      confidence,
      isAnswered,
      isFallback,
      inquiryCreated: ctx.inquiryCreated ?? false,
      language: ctx.language,
      question: ctx.question,
      topic,
      category,
    });
  }

  // ─── Unanswered Tracking ────────────────────────────────────────────────────

  private static async trackUnanswered(ctx: EventContext): Promise<void> {
    if (ctx.isInquiryMode) return; // Don't track inquiry steps as unanswered questions

    const confidence = ctx.botResponse.metadata?.confidence ?? 0;
    const matchedType = ctx.botResponse.metadata?.matchedType;
    const shouldTrack =
      matchedType === 'unknown' ||
      ctx.botResponse.triggerInquiry ||
      confidence < CONFIDENCE_LOW;

    if (!shouldTrack) return;

    const reason = classifyUnansweredReason(ctx.botResponse, confidence);

    await UnansweredService.track({
      clientId: ctx.clientId,
      question: ctx.question,
      sessionId: ctx.sessionId,
      visitorId: ctx.visitorId,
      conversationId: ctx.chatId,
      confidenceScore: confidence,
      reason,
    });
  }

  // ─── ChatMessage Metadata Enrichment ───────────────────────────────────────

  private static async enrichMessageMetadata(ctx: EventContext): Promise<void> {
    if (!ctx.botMessageId) return;

    const updates: Record<string, any> = {
      'metadata.fallbackTriggered': !!ctx.botResponse.triggerInquiry,
    };

    if (ctx.intent) {
      updates['metadata.intent'] = ctx.intent;
    }

    if (ctx.retrievedChunkIds && ctx.retrievedChunkIds.length > 0) {
      updates['metadata.retrievedChunkIds'] = ctx.retrievedChunkIds;
    }

    if (ctx.inquiryCreated !== undefined) {
      updates['metadata.inquiryCreated'] = ctx.inquiryCreated;
    }

    await ChatMessageModel.findByIdAndUpdate(ctx.botMessageId, { $set: updates });
  }
}
