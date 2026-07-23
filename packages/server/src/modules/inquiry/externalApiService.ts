import { ClientConfigModel } from '../clientConfig/clientConfig.model';
import { InquiryDocument } from './inquiry.model';
import { logger } from '../../utils/logger';

export interface ExternalApiResponse {
  success: boolean;
  status: 'forwarded' | 'failed' | 'no_api';
  response?: string;
  error?: string;
}

export class ExternalApiService {
  static async forwardInquiry(
    inquiry: InquiryDocument,
    clientId: string
  ): Promise<ExternalApiResponse> {
    try {
      const config = await ClientConfigModel.findOne({ clientId });

      if (!config || !config.inquiryApiUrl) {
        return {
          success: true,
          status: 'no_api',
          response: 'No external API configured',
        };
      }

      const payload = {
        name: inquiry.name,
        email: inquiry.email,
        phone: inquiry.phone,
        country: inquiry.country,
        state: inquiry.state,
        service: inquiry.service,
        details: inquiry.details,
        company: inquiry.company,
        source: 'chatbot',
        language: inquiry.language,
        submittedAt: inquiry.submittedAt,
        sessionId: inquiry.sessionId,
      };

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (config.inquiryApiKey) {
        headers['Authorization'] = `Bearer ${config.inquiryApiKey}`;
      }

      const response = await fetch(config.inquiryApiUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(10000),
      });

      const responseText = await response.text();

      if (response.ok) {
        logger.info(`External API forwarded inquiry for client ${clientId}`, {
          status: response.status,
          response: responseText.substring(0, 200),
        });

        return {
          success: true,
          status: 'forwarded',
          response: responseText.substring(0, 500),
        };
      }

      logger.error(`External API failed for client ${clientId}`, {
        status: response.status,
        response: responseText.substring(0, 200),
      });

      return {
        success: false,
        status: 'failed',
        response: responseText.substring(0, 500),
        error: `API returned status ${response.status}`,
      };
    } catch (error) {
      logger.error(`External API error for client ${clientId}`, {
        error: error instanceof Error ? error.message : 'Unknown error',
      });

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
