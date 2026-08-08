import mongoose from 'mongoose';
import { ClientFormModel, ClientFormDocument } from './clientForm.model.js';
import { ClientModel } from '../client/client.model.js';
import { FormDetector } from './formDetector.js';
import { ClientForm } from '@nestchat/shared';
import { logger } from '../../utils/logger.js';
import { ApiError } from '../../utils/apiError.js';

export class ClientFormService {
  /**
   * Save forms detected during website crawl.
   * Preserves existing admin mappings if the form was already configured.
   */
  static async saveDetectedForms(clientId: string, detectedForms: ClientForm[]): Promise<number> {
    if (!detectedForms || detectedForms.length === 0) return 0;

    let clientObjectId: mongoose.Types.ObjectId;
    if (mongoose.Types.ObjectId.isValid(clientId)) {
      clientObjectId = new mongoose.Types.ObjectId(clientId);
    } else {
      const client = await ClientModel.findOne({ clientId: clientId.trim().toLowerCase() }).lean();
      if (!client) {
        logger.warn(`[ClientFormService] Client ${clientId} not found for form saving`);
        return 0;
      }
      clientObjectId = client._id as mongoose.Types.ObjectId;
    }

    let savedCount = 0;

    for (const form of detectedForms) {
      try {
        const existing = await ClientFormModel.findOne({
          clientId: clientObjectId,
          formId: form.formId,
        });

        if (existing) {
          // Update lastScanned and endpoint/action while preserving custom field mappings
          existing.lastScanned = new Date();
          existing.action = form.action || existing.action;
          existing.pageUrl = form.pageUrl || existing.pageUrl;

          // Merge fields without overwriting admin's existing mappedTo customizations
          const fieldMap = new Map(existing.fields.map(f => [f.fieldName, f]));
          for (const newField of form.fields) {
            if (fieldMap.has(newField.fieldName)) {
              const oldField = fieldMap.get(newField.fieldName)!;
              newField.mappedTo = oldField.mappedTo || newField.mappedTo;
              newField.customKey = oldField.customKey || newField.customKey;
              newField.label = oldField.label || newField.label;
            }
          }

          existing.fields = form.fields as any;
          await existing.save();
        } else {
          // Create new detected form record
          await ClientFormModel.create({
            clientId: clientObjectId,
            formId: form.formId,
            formName: form.formName,
            pageUrl: form.pageUrl,
            action: form.action,
            method: form.method || 'POST',
            fields: form.fields,
            formType: form.formType || 'inquiry',
            isActive: true,
            isPrimary: savedCount === 0,
            lastScanned: new Date(),
            submissionType: form.submissionType || 'html_form',
            submissionEndpoint: form.submissionEndpoint || form.action,
          });
        }
        savedCount++;
      } catch (err) {
        logger.error(`[ClientFormService] Error saving form ${form.formId} for client ${clientId}:`, err);
      }
    }

    logger.info(`[ClientFormService] Saved/Updated ${savedCount} forms for client ${clientId}`);
    return savedCount;
  }

  /**
   * Get all website forms for a client (with strict tenant isolation).
   */
  static async getClientForms(clientId: string): Promise<ClientFormDocument[]> {
    const clientObjectId = await this.resolveClientId(clientId);
    return ClientFormModel.find({ clientId: clientObjectId }).sort({ isPrimary: -1, createdAt: -1 });
  }

  /**
   * Get a specific form by formId (with tenant isolation).
   */
  static async getClientFormById(clientId: string, formId: string): Promise<ClientFormDocument> {
    const clientObjectId = await this.resolveClientId(clientId);
    const form = await ClientFormModel.findOne({ clientId: clientObjectId, formId });

    if (!form) {
      throw ApiError.notFound('Form not found for this client');
    }

    return form;
  }

  /**
   * Update client form settings or field mappings.
   */
  static async updateClientForm(clientId: string, formId: string, updates: Partial<ClientForm>): Promise<ClientFormDocument> {
    const clientObjectId = await this.resolveClientId(clientId);

    if (updates.isPrimary) {
      // Unset primary from all other forms for this client
      await ClientFormModel.updateMany({ clientId: clientObjectId }, { $set: { isPrimary: false } });
    }

    const form = await ClientFormModel.findOneAndUpdate(
      { clientId: clientObjectId, formId },
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!form) {
      throw ApiError.notFound('Form not found for update');
    }

    return form;
  }

  /**
   * Delete a form configuration.
   */
  static async deleteClientForm(clientId: string, formId: string): Promise<{ success: boolean }> {
    const clientObjectId = await this.resolveClientId(clientId);
    const result = await ClientFormModel.deleteOne({ clientId: clientObjectId, formId });

    if (result.deletedCount === 0) {
      throw ApiError.notFound('Form not found for deletion');
    }

    return { success: true };
  }

  /**
   * Helper to discover sub-pages (e.g., /contact.html, /contact, /booking) for form scanning.
   */
  private static async discoverFormPages(baseUrl: string): Promise<string[]> {
    const pages = new Set<string>();
    const cleanBase = baseUrl.replace(/\/$/, '');
    pages.add(cleanBase);

    // Common contact/inquiry subpaths to prioritize
    const commonPaths = [
      '/contact', '/contact.html', '/contact.php', '/contact-us',
      '/inquiry', '/get-quote', '/booking', '/reservation'
    ];
    for (const p of commonPaths) {
      try {
        pages.add(`${cleanBase}${p}`);
      } catch { /* skip */ }
    }

    try {
      const response = await fetch(cleanBase, {
        signal: AbortSignal.timeout(8000),
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; NestChatBot/1.0)' },
      });

      if (response.ok) {
        const html = await response.text();
        const baseHost = new URL(cleanBase).hostname;
        const linkRegex = /<a[^>]*href=["']([^"']+)["'][^>]*>/gi;
        let match: RegExpExecArray | null;

        while ((match = linkRegex.exec(html)) !== null) {
          let href = match[1].split('#')[0].split('?')[0];
          if (!href || href === '/' || href.startsWith('#') || href.startsWith('javascript:')) continue;

          try {
            const fullUrl = new URL(href, cleanBase);
            if (fullUrl.hostname === baseHost && !fullUrl.pathname.match(/\.(pdf|zip|png|jpg|jpeg|gif|svg|css|js|xml|json|ico|webp)$/i)) {
              const cleanUrl = fullUrl.origin + fullUrl.pathname.replace(/\/$/, '');
              if (pages.size < 15) {
                pages.add(cleanUrl);
              }
            }
          } catch { /* skip invalid URL */ }
        }
      }
    } catch { /* skip homepage discovery fetch error */ }

    return Array.from(pages);
  }

  /**
   * Trigger an on-demand HTML form scan for a client's website URL and its sub-pages.
   */
  static async scanWebsiteForms(clientId: string): Promise<{ success: boolean; formsFound: number; forms: ClientFormDocument[] }> {
    const clientObjectId = await this.resolveClientId(clientId);
    const client = await ClientModel.findById(clientObjectId).lean();

    if (!client || !client.website) {
      throw ApiError.badRequest('Client website URL is not configured');
    }

    const targetUrl = client.website.startsWith('http') ? client.website : `https://${client.website}`;

    try {
      const pagesToScan = await this.discoverFormPages(targetUrl);
      const allDetectedForms: ClientForm[] = [];

      for (const pageUrl of pagesToScan) {
        try {
          const response = await fetch(pageUrl, {
            signal: AbortSignal.timeout(8000),
            headers: { 'User-Agent': 'Mozilla/5.0 (compatible; NestChatBot/1.0)' },
          });

          if (response.ok) {
            const html = await response.text();
            const detected = FormDetector.extractFormsFromHtml(html, pageUrl, clientObjectId.toString());
            if (detected.length > 0) {
              allDetectedForms.push(...detected);
            }
          }
        } catch { /* skip individual page scan error */ }
      }

      if (allDetectedForms.length > 0) {
        await this.saveDetectedForms(clientObjectId.toString(), allDetectedForms);
      }

      const forms = await this.getClientForms(clientId);
      return {
        success: true,
        formsFound: allDetectedForms.length,
        forms,
      };
    } catch (err) {
      logger.error(`[ClientFormService] Manual website form scan failed for ${clientId}:`, err);
      throw ApiError.badRequest(`Failed to scan forms: ${(err as Error).message}`);
    }
  }

  /**
   * Helper to resolve string or ObjectId clientId to valid mongoose ObjectId.
   */
  private static async resolveClientId(clientId: string): Promise<mongoose.Types.ObjectId> {
    if (mongoose.Types.ObjectId.isValid(clientId)) {
      return new mongoose.Types.ObjectId(clientId);
    }

    const client = await ClientModel.findOne({ clientId: clientId.trim().toLowerCase() }).lean();
    if (!client) {
      throw ApiError.notFound('Client not found');
    }

    return client._id as mongoose.Types.ObjectId;
  }
}
