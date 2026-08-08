import { ClientForm, FormSubmissionResult } from '@nestchat/shared';
import { logger } from '../../../../utils/logger.js';

export class WordPressAdapter {
  static async submit(form: ClientForm, payload: Record<string, any>): Promise<FormSubmissionResult> {
    try {
      const endpoint = form.submissionEndpoint || form.action;
      logger.info(`[WordPressAdapter] Submitting to WP form endpoint ${endpoint}`);

      const formData = new FormData();
      for (const [key, value] of Object.entries(payload)) {
        if (value !== undefined && value !== null) {
          formData.append(key, String(value));
        }
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; NestChatBot/1.0)',
          ...(form.headers || {}),
        },
        body: formData,
        signal: AbortSignal.timeout(10000),
      });

      const resText = await response.text();
      const isOk = response.status >= 200 && response.status < 300;

      return {
        success: isOk,
        submissionStatus: isOk ? 'submitted' : 'failed',
        submissionMethod: 'wordpress',
        externalSubmissionId: `wp_${Date.now()}`,
        responsePayload: resText.substring(0, 500),
        error: isOk ? undefined : `WordPress form returned HTTP ${response.status}`,
      };
    } catch (err) {
      logger.error(`[WordPressAdapter] Error submitting WP form:`, err);
      return {
        success: false,
        submissionStatus: 'failed',
        submissionMethod: 'wordpress',
        error: (err as Error).message,
      };
    }
  }
}
