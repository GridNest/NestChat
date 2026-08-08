import { ClientForm, FormSubmissionResult } from '@nestchat/shared';
import { logger } from '../../../../utils/logger.js';

export class HtmlFormAdapter {
  static async submit(form: ClientForm, payload: Record<string, any>): Promise<FormSubmissionResult> {
    try {
      const endpoint = form.submissionEndpoint || form.action || form.pageUrl;
      const method = (form.method || 'POST').toUpperCase();

      const params = new URLSearchParams();
      for (const [key, value] of Object.entries(payload)) {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      }

      logger.info(`[HtmlFormAdapter] Submitting to ${endpoint} via ${method}`);

      let response: Response;
      if (method === 'GET') {
        const getUrl = `${endpoint}${endpoint.includes('?') ? '&' : '?'}${params.toString()}`;
        response = await fetch(getUrl, {
          method: 'GET',
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; NestChatBot/1.0)' },
          signal: AbortSignal.timeout(10000),
        });
      } else {
        response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': 'Mozilla/5.0 (compatible; NestChatBot/1.0)',
            ...(form.headers || {}),
          },
          body: params.toString(),
          signal: AbortSignal.timeout(10000),
        });
      }

      const resText = await response.text();
      const isOk = response.status >= 200 && response.status < 300;

      return {
        success: isOk,
        submissionStatus: isOk ? 'submitted' : 'failed',
        submissionMethod: 'html_form',
        externalSubmissionId: `html_${Date.now()}`,
        responsePayload: resText.substring(0, 500),
        error: isOk ? undefined : `Form submission returned HTTP ${response.status}`,
      };
    } catch (err) {
      logger.error(`[HtmlFormAdapter] Error submitting form:`, err);
      return {
        success: false,
        submissionStatus: 'failed',
        submissionMethod: 'html_form',
        error: (err as Error).message,
      };
    }
  }
}
