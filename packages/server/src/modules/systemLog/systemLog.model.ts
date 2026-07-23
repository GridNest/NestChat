import mongoose, { Document, Schema } from 'mongoose';

export interface ISystemLog extends Document {
  level: 'info' | 'warn' | 'error' | 'fatal';
  category: 'system' | 'api' | 'security' | 'widget' | 'database' | 'auth';
  message: string;
  details?: any;
  stack?: string;
  requestId?: string;
  userId?: mongoose.Types.ObjectId;
  clientId?: mongoose.Types.ObjectId;
  ip?: string;
  userAgent?: string;
  method?: string;
  url?: string;
  statusCode?: number;
  duration?: number;
  timestamp: Date;
}

const systemLogSchema = new Schema<ISystemLog>(
  {
    level: { 
      type: String, 
      enum: ['info', 'warn', 'error', 'fatal'], 
      required: true, 
      index: true 
    },
    category: { 
      type: String, 
      enum: ['system', 'api', 'security', 'widget', 'database', 'auth'], 
      required: true, 
      index: true 
    },
    message: { type: String, required: true },
    details: Schema.Types.Mixed,
    stack: String,
    requestId: String,
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    clientId: { type: Schema.Types.ObjectId, ref: 'Client' },
    ip: String,
    userAgent: String,
    method: String,
    url: String,
    statusCode: Number,
    duration: Number,
    timestamp: { type: Date, default: Date.now, index: true },
  },
  {
    timestamps: false,
  }
);

systemLogSchema.index({ timestamp: -1 });
systemLogSchema.index({ level: 1, timestamp: -1 });
systemLogSchema.index({ category: 1, timestamp: -1 });

export const SystemLog = mongoose.model<ISystemLog>('SystemLog', systemLogSchema);
