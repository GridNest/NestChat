import mongoose, { Document, Schema } from 'mongoose';

export interface AgentDocument extends Document {
  userId: mongoose.Types.ObjectId;
  clientId: mongoose.Types.ObjectId;
  status: 'online' | 'offline' | 'away';
  maxChats: number;
  assignedChats: mongoose.Types.ObjectId[];
  lastActiveAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const agentSchema = new Schema<AgentDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    clientId: {
      type: Schema.Types.ObjectId,
      ref: 'Client',
      required: false,
      index: true,
    },
    status: {
      type: String,
      enum: ['online', 'offline', 'away'],
      default: 'offline',
    },
    maxChats: {
      type: Number,
      default: 5,
    },
    assignedChats: [{
      type: Schema.Types.ObjectId,
      ref: 'Chat',
    }],
    lastActiveAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

agentSchema.index({ clientId: 1, status: 1 });
agentSchema.index({ userId: 1 }, { unique: true });

export const AgentModel = mongoose.model<AgentDocument>('Agent', agentSchema);