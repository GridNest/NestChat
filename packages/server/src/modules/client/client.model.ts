import mongoose, { Document, Schema } from 'mongoose';

export interface ClientDocument extends Document {
  name: string;
  email: string;
  company: string;
  phone?: string;
  website?: string;
  industry?: string;
  isActive: boolean;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const clientSchema = new Schema<ClientDocument>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    company: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    website: {
      type: String,
      trim: true,
    },
    industry: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

clientSchema.index({ email: 1 });
clientSchema.index({ createdBy: 1 });

export const ClientModel = mongoose.model<ClientDocument>('Client', clientSchema);
