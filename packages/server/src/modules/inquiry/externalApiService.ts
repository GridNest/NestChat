import mongoose from 'mongoose';
import { ClientConfigModel } from '../clientConfig/clientConfig.model.js';
import { ClientModel } from '../client/client.model.js';
import { InquiryDocument } from './inquiry.model.js';
import { logger } from '../../utils/logger.js';

export interface ExternalApiResponse {
  success: boolean;
  status: 'forwarded' | 'failed' | 'no_api';
  response?: string;
  error?: string;
}

export class ExternalApiService {
  /**
   * Helper to resolve string or ObjectId clientId to valid mongoose ObjectId.
   */
  private static async resolveClientId(clientId: string): Promise<mongoose.Types.ObjectId | null> {
    if (!clientId) return null;
    if (mongoose.Types.ObjectId.isValid(clientId)) {
      return new mongoose.Types.ObjectId(clientId);
    }
    const client = await ClientModel.findOne({ clientId: clientId.trim().toLowerCase() }).lean();
    return client ? (client._id as mongoose.Types.ObjectId) : null;
  }

  static async forwardInquiry(
    inquiry: InquiryDocument,
    clientId: string
  ): Promise<ExternalApiResponse> {
    try {
      const resolvedId = await this.resolveClientId(clientId);
      if (!resolvedId) {
        logger.warn(`[ExternalApiService] Could not resolve clientId: ${clientId}`);
        return {
          success: false,
          status: 'no_api',
          response: 'Client not found',
        };
      }

      const [config, client] = await Promise.all([
        ClientConfigModel.findOne({ clientId: resolvedId }).lean(),
        ClientModel.findById(resolvedId).lean(),
      ]);

      let targetUrl = config?.inquiryApiUrl;
      const apiKey = config?.inquiryApiKey;

      // Dynamic fallback if inquiryApiUrl is not explicitly configured in ClientConfig:
      // Derive from client's website URL (e.g. https://gridnestsolution.in/api/contact or /api/inquiries)
      if (!targetUrl && client?.website) {
        const base = client.website.startsWith('http') ? client.website : `https://${client.website}`;
        const cleanBase = base.replace(/\/$/, '');
        targetUrl = `${cleanBase}/api/contact`;
      }

      if (!targetUrl) {
        return {
          success: true,
          status: 'no_api',
          response: 'No external API endpoint configured for this client',
        };
      }

      const payload = {
        fullName: inquiry.name,
        name: inquiry.name,
        email: inquiry.email,
        phone: inquiry.phone,
        country: inquiry.country || 'India',
        state: inquiry.state || 'Uttar Pradesh',
        service: inquiry.service || 'Other',
        message: inquiry.details || inquiry.originalQuestion || '',
        details: inquiry.details || inquiry.originalQuestion || '',
        company: inquiry.company || inquiry.phone || '',
        source: 'chatbot',
        language: inquiry.language || 'en',
        submittedAt: inquiry.submittedAt || new Date(),
        sessionId: inquiry.sessionId,
      };

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (apiKey) {
        headers['Authorization'] = `Bearer ${apiKey}`;
        headers['X-API-Key'] = apiKey;
      }

      logger.info(`[ExternalApiService] Forwarding inquiry to ${targetUrl} for client ${clientId}`);

      const response = await fetch(targetUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(10000),
      });

      const responseText = await response.text();

      if (response.ok) {
        logger.info(`[ExternalApiService] Successfully forwarded inquiry for client ${clientId}: HTTP ${response.status}`);
        return {
          success: true,
          status: 'forwarded',
          response: responseText.substring(0, 500),
        };
      }

      // If /api/contact returned 404/405, attempt fallback endpoint /api/inquiries
      if ((response.status === 404 || response.status === 405) && targetUrl.endsWith('/api/contact')) {
        const altUrl = targetUrl.replace('/api/contact', '/api/inquiries');
        logger.info(`[ExternalApiService] Trying alternative endpoint ${altUrl}...`);
        try {
          const altResponse = await fetch(altUrl, {
            method: 'POST',
            headers,
            body: JSON.stringify(payload),
            signal: AbortSignal.timeout(10000),
          });
          const altText = await altResponse.text();
          if (altResponse.ok) {
            return {
              success: true,
              status: 'forwarded',
              response: altText.substring(0, 500),
            };
          }
        } catch { /* skip alt error */ }
      }

      logger.error(`[ExternalApiService] External API failed for client ${clientId}: HTTP ${response.status}`);
      return {
        success: false,
        status: 'failed',
        response: responseText.substring(0, 500),
        error: `API returned status ${response.status}`,
      };
    } catch (error) {
      logger.error(`[ExternalApiService] Error forwarding inquiry for ${clientId}:`, error);
      return {
        success: false,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  static async retryForward(
    inquiry: InquiryDocument,
    clientId: string,
    maxRetries: number = 3
  ): Promise<ExternalApiResponse> {
    let lastError: ExternalApiResponse | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      const result = await this.forwardInquiry(inquiry, clientId);

      if (result.status === 'forwarded' || result.status === 'no_api') {
        return result;
      }

      lastError = result;

      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }

    return lastError || {
      success: false,
      status: 'failed',
      error: 'Max retries exceeded',
    };
  }
}
