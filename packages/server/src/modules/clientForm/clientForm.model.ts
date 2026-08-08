import mongoose, { Document, Schema } from 'mongoose';
import { ClientForm as IClientForm, ClientFormField, FormType, FormSubmissionType } from '@nestchat/shared';

export interface ClientFormDocument extends Omit<IClientForm, 'id' | '_id' | 'clientId'>, Document {
  clientId: mongoose.Types.ObjectId;
}

const clientFormFieldSchema = new Schema<ClientFormField>(
  {
    fieldId: { type: String, required: true },
    fieldName: { type: String, required: true },
    label: { type: String, required: true },
    type: {
      type: String,
      enum: ['text', 'email', 'tel', 'number', 'textarea', 'select', 'checkbox', 'radio', 'date', 'time', 'hidden', 'other'],
      default: 'text',
    },
    required: { type: Boolean, default: false },
    options: [{ type: String }],
    placeholder: { type: String },
    mappedTo: {
      type: String,
      enum: [
        'visitor.name',
        'visitor.email',
        'visitor.phone',
        'visitor.message',
        'visitor.company',
        'visitor.subject',
        'visitor.date',
        'visitor.guests',
        'visitor.occasion',
        'visitor.budget',
        'visitor.address',
        'visitor.custom',
      ],
      default: 'visitor.custom',
    },
    customKey: { type: String },
  },
  { _id: false }
);

const clientFormSchema = new Schema<ClientFormDocument>(
  {
    clientId: {
      type: Schema.Types.ObjectId,
      ref: 'Client',
      required: true,
      index: true,
    },
    formId: {
      type: String,
      required: true,
      trim: true,
    },
    formName: {
      type: String,
      required: true,
      trim: true,
    },
    pageUrl: {
      type: String,
      required: true,
    },
    action: {
      type: String,
      required: true,
    },
    method: {
      type: String,
      enum: ['GET', 'POST'],
      default: 'POST',
    },
    fields: [clientFormFieldSchema],
    formType: {
      type: String,
      enum: ['contact', 'inquiry', 'booking', 'reservation', 'quote', 'newsletter', 'application', 'custom'],
      default: 'inquiry',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isPrimary: {
      type: Boolean,
      default: false,
    },
    lastScanned: {
      type: Date,
      default: Date.now,
    },
    submissionType: {
      type: String,
      enum: ['html_form', 'api_endpoint', 'wordpress', 'webhook', 'unsupported'],
      default: 'html_form',
    },
    submissionEndpoint: {
      type: String,
    },
    headers: {
      type: Map,
      of: String,
    },
  },
  {
    timestamps: true,
  }
);

clientFormSchema.index({ clientId: 1, formId: 1 }, { unique: true });
clientFormSchema.index({ clientId: 1, isActive: 1 });
clientFormSchema.index({ clientId: 1, isPrimary: 1 });

export const ClientFormModel = mongoose.model<ClientFormDocument>('ClientForm', clientFormSchema);
