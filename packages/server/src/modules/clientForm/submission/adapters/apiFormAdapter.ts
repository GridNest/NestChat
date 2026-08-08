import { ClientForm, FormSubmissionResult } from '@nestchat/shared';
import { logger } from '../../../../utils/logger.js';

export class ApiFormAdapter {
  static async submit(form: ClientForm, payload: Record<string, any>): Promise<FormSubmissionResult> {
    try {
      const endpoint = form.submissionEndpoint || form.action;
      logger.info(`[ApiFormAdapter] Submitting JSON payload to ${endpoint}`);

      const response = await fetch(endpoint, {
        method: form.method || 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (compatible; NestChatBot/1.0)',
          ...(form.headers || {}),
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(10000),
      });

      const resText = await response.text();
      const isOk = response.status >= 200 && response.status < 300;

      return {
        success: isOk,
        submissionStatus: isOk ? 'submitted' : 'failed',
        submissionMethod: 'api_endpoint',
        externalSubmissionId: `api_${Date.now()}`,
        responsePayload: resText.substring(0, 500),
        error: isOk ? undefined : `API endpoint returned HTTP ${response.status}`,
      };
    } catch (err) {
      logger.error(`[ApiFormAdapter] Error submitting API form:`, err);
      return {
        success: false,
        submissionStatus: 'failed',
        submissionMethod: 'api_endpoint',
        error: (err as Error).message,
      };
    }
  }
}
