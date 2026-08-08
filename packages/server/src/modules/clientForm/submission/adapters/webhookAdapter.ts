import { ClientForm, FormSubmissionResult } from '@nestchat/shared';
import { logger } from '../../../../utils/logger.js';

export class WebhookAdapter {
  static async submit(form: ClientForm, payload: Record<string, any>): Promise<FormSubmissionResult> {
    try {
      const endpoint = form.submissionEndpoint || form.action;
      logger.info(`[WebhookAdapter] Dispatching webhook to ${endpoint}`);

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (compatible; NestChatBot/1.0)',
          ...(form.headers || {}),
        },
        body: JSON.stringify({
          source: 'NestChat_Lead_Integration',
          formId: form.formId,
          formName: form.formName,
          submittedAt: new Date().toISOString(),
          data: payload,
        }),
        signal: AbortSignal.timeout(10000),
      });

      const resText = await response.text();
      const isOk = response.status >= 200 && response.status < 300;

      return {
        success: isOk,
        submissionStatus: isOk ? 'submitted' : 'failed',
        submissionMethod: 'webhook',
        externalSubmissionId: `webhook_${Date.now()}`,
        responsePayload: resText.substring(0, 500),
        error: isOk ? undefined : `Webhook returned HTTP ${response.status}`,
      };
    } catch (err) {
      logger.error(`[WebhookAdapter] Error sending webhook:`, err);
      return {
        success: false,
        submissionStatus: 'failed',
        submissionMethod: 'webhook',
        error: (err as Error).message,
      };
    }
  }
}
