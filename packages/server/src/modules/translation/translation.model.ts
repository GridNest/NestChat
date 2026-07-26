import mongoose, { Document, Schema } from 'mongoose';

export interface TranslationDocument extends Document {
  clientId: mongoose.Types.ObjectId;
  language: string;
  key: string;
  value: string;
  createdAt: Date;
  updatedAt: Date;
}

const translationSchema = new Schema<TranslationDocument>(
  {
    clientId: {
      type: Schema.Types.ObjectId,
      ref: 'Client',
      required: true,
      index: true,
    },
    language: {
      type: String,
      required: true,
      lowercase: true,
    },
    key: {
      type: String,
      required: true,
      trim: true,
    },
    value: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

translationSchema.index({ clientId: 1, language: 1, key: 1 }, { unique: true });

export const TranslationModel = mongoose.model<TranslationDocument>('Translation', translationSchema);