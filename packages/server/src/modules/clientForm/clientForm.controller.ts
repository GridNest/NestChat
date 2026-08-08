import { Request, Response, NextFunction } from 'express';
import { ClientFormService } from './clientForm.service.js';
import { FormSubmissionService } from './submission/formSubmissionService.js';
import { logger } from '../../utils/logger.js';

export class ClientFormController {
  /**
   * GET /api/client-forms/:clientId
   */
  static async getForms(req: Request, res: Response, next: NextFunction) {
    try {
      const { clientId } = req.params;
      const forms = await ClientFormService.getClientForms(clientId);
      res.json({ success: true, count: forms.length, data: forms });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/client-forms/:clientId/scan
   */
  static async scanForms(req: Request, res: Response, next: NextFunction) {
    try {
      const { clientId } = req.params;
      const result = await ClientFormService.scanWebsiteForms(clientId);
      res.json({ success: true, message: `Scanned website forms successfully`, data: result });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/client-forms/:clientId/:formId
   */
  static async getFormById(req: Request, res: Response, next: NextFunction) {
    try {
      const { clientId, formId } = req.params;
      const form = await ClientFormService.getClientFormById(clientId, formId);
      res.json({ success: true, data: form });
    } catch (err) {
      next(err);
    }
  }

  /**
   * PUT /api/client-forms/:clientId/:formId
   */
  static async updateForm(req: Request, res: Response, next: NextFunction) {
    try {
      const { clientId, formId } = req.params;
      const form = await ClientFormService.updateClientForm(clientId, formId, req.body);
      res.json({ success: true, message: 'Form configuration updated', data: form });
    } catch (err) {
      next(err);
    }
  }

  /**
   * DELETE /api/client-forms/:clientId/:formId
   */
  static async deleteForm(req: Request, res: Response, next: NextFunction) {
    try {
      const { clientId, formId } = req.params;
      await ClientFormService.deleteClientForm(clientId, formId);
      res.json({ success: true, message: 'Form deleted successfully' });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/client-forms/:clientId/:formId/test
   * Safely previews payload mapping & tests submission in dry-run/preview mode.
   */
  static async testFormSubmission(req: Request, res: Response, next: NextFunction) {
    try {
      const { clientId, formId } = req.params;
      const sampleData = req.body || {};

      const testResult = await FormSubmissionService.previewSubmission(clientId, formId, sampleData);
      res.json({ success: true, data: testResult });
    } catch (err) {
      next(err);
    }
  }
}
