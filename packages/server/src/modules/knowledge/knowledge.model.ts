import mongoose, { Document, Schema } from 'mongoose';

export interface KnowledgeDocument extends Document {
  clientId: mongoose.Types.ObjectId;
  pageName: string;
  slug: string;
  title: string;
  content: string;
  metaDescription?: string;
  tags: string[];
  category: string;
  language: 'en' | 'hi' | 'both';
  priority: number;
  isActive: boolean;
  isDeleted: boolean;
  createdBy?: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const knowledgeSchema = new Schema<KnowledgeDocument>(
  {
    clientId: {
      type: Schema.Types.ObjectId,
      ref: 'Client',
      required: true,
      index: true,
    },
    pageName: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      required: true,
    },
    metaDescription: {
      type: String,
      trim: true,
    },
    tags: {
      type: [String],
      default: [],
    },
    category: {
      type: String,
      default: 'general',
      trim: true,
      lowercase: true,
    },
    language: {
      type: String,
      enum: ['en', 'hi', 'both'],
      default: 'en',
    },
    priority: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

knowledgeSchema.index({ clientId: 1, slug: 1 }, { unique: true });
knowledgeSchema.index({ clientId: 1, isActive: 1, isDeleted: 1 });
knowledgeSchema.index({ clientId: 1, tags: 1 });
knowledgeSchema.index({ clientId: 1, category: 1 });
knowledgeSchema.index(
  { title: 'text', content: 'text', tags: 'text', metaDescription: 'text' },
  { weights: { title: 10, tags: 8, content: 5, metaDescription: 2 } }
);

export const KnowledgeModel = mongoose.model<KnowledgeDocument>(
  'Knowledge',
  knowledgeSchema
);
