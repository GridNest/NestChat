import mongoose, { Document, Schema } from 'mongoose';

export interface UserRoleDocument extends Document {
  userId: mongoose.Types.ObjectId;
  clientId: mongoose.Types.ObjectId;
  roleId: mongoose.Types.ObjectId;
  assignedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const userRoleSchema = new Schema<UserRoleDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    clientId: {
      type: Schema.Types.ObjectId,
      ref: 'Client',
      required: true,
    },
    roleId: {
      type: Schema.Types.ObjectId,
      ref: 'Role',
      required: true,
    },
    assignedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

userRoleSchema.index({ userId: 1, clientId: 1 }, { unique: true });
userRoleSchema.index({ clientId: 1 });
userRoleSchema.index({ roleId: 1 });

export const UserRoleModel = mongoose.model<UserRoleDocument>('UserRole', userRoleSchema);
