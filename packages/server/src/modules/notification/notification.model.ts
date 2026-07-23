import mongoose, { Document, Schema } from 'mongoose';

export interface NotificationDocument extends Document {
  userId: mongoose.Types.ObjectId;
  type: 'inquiry' | 'client' | 'api_failed' | 'system' | 'chat';
  title: string;
  message: string;
  read: boolean;
  data?: Record<string, any>;
  createdAt: Date;
}

const notificationSchema = new Schema<NotificationDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: ['inquiry', 'client', 'api_failed', 'system', 'chat'],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    read: {
      type: Boolean,
      default: false,
    },
    data: {
      type: Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

notificationSchema.index({ userId: 1, read: 1 });
notificationSchema.index({ createdAt: -1 });

export const NotificationModel = mongoose.model<NotificationDocument>('Notification', notificationSchema);
