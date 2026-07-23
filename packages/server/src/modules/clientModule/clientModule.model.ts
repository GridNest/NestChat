import mongoose, { Document, Schema } from 'mongoose';

export type ModuleName = 
  | 'FAQ' 
  | 'Knowledge' 
  | 'Inquiry' 
  | 'Gallery' 
  | 'Menu' 
  | 'Rooms' 
  | 'Products' 
  | 'Services' 
  | 'Portfolio' 
  | 'Blog' 
  | 'Events' 
  | 'Booking' 
  | 'Contact';

export interface ClientModuleDocument extends Document {
  clientId: mongoose.Types.ObjectId;
  name: ModuleName;
  enabled: boolean;
  config: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const clientModuleSchema = new Schema<ClientModuleDocument>(
  {
    clientId: {
      type: Schema.Types.ObjectId,
      ref: 'Client',
      required: true,
    },
    name: {
      type: String,
      enum: ['FAQ', 'Knowledge', 'Inquiry', 'Gallery', 'Menu', 'Rooms', 'Products', 'Services', 'Portfolio', 'Blog', 'Events', 'Booking', 'Contact'],
      required: true,
    },
    enabled: {
      type: Boolean,
      default: true,
    },
    config: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

clientModuleSchema.index({ clientId: 1 });
clientModuleSchema.index({ clientId: 1, name: 1 }, { unique: true });

export const ClientModuleModel = mongoose.model<ClientModuleDocument>(
  'ClientModule',
  clientModuleSchema
);
