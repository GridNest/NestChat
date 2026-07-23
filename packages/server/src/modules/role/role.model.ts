import mongoose, { Document, Schema } from 'mongoose';

export interface Permission {
  resource: string;
  actions: ('create' | 'read' | 'update' | 'delete')[];
}

export interface RoleDocument extends Document {
  name: string;
  description: string;
  permissions: Permission[];
  isSystem: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const roleSchema = new Schema<RoleDocument>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    permissions: [
      {
        resource: {
          type: String,
          required: true,
        },
        actions: {
          type: [String],
          enum: ['create', 'read', 'update', 'delete'],
          required: true,
        },
      },
    ],
    isSystem: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

roleSchema.index({ name: 1 });

export const RoleModel = mongoose.model<RoleDocument>('Role', roleSchema);
