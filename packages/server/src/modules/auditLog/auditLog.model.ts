import mongoose, { Document, Schema } from 'mongoose';

export interface AuditLogDocument extends Document {
  userId: mongoose.Types.ObjectId;
  clientId?: mongoose.Types.ObjectId;
  action: string;
  module: string;
  resourceId?: string;
  oldValue?: any;
  newValue?: any;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

const auditLogSchema = new Schema<AuditLogDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    clientId: {
      type: Schema.Types.ObjectId,
      ref: 'Client',
    },
    action: {
      type: String,
      required: true,
      enum: ['create', 'update', 'delete', 'login', 'logout', 'export', 'import'],
    },
    module: {
      type: String,
      required: true,
      enum: ['client', 'knowledge', 'faq', 'chat', 'inquiry', 'user', 'role', 'settings', 'theme', 'module'],
    },
    resourceId: {
      type: String,
    },
    oldValue: {
      type: Schema.Types.Mixed,
    },
    newValue: {
      type: Schema.Types.Mixed,
    },
    ipAddress: {
      type: String,
    },
    userAgent: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

auditLogSchema.index({ userId: 1 });
auditLogSchema.index({ clientId: 1 });
auditLogSchema.index({ module: 1 });
auditLogSchema.index({ createdAt: -1 });

export const AuditLogModel = mongoose.model<AuditLogDocument>('AuditLog', auditLogSchema);
