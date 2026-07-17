import { Schema, model, Document, Types } from 'mongoose';

export interface IPrivateMessage extends Document {
  senderId: Types.ObjectId;
  recipientId: Types.ObjectId;
  message: string;
  type: 'text' | 'voice';
  mediaUrl?: string;
  duration?: number;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const privateMessageSchema = new Schema<IPrivateMessage>(
  {
    senderId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    recipientId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    message: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['text', 'voice'],
      default: 'text',
    },
    mediaUrl: {
      type: String,
    },
    duration: {
      type: Number,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export const PrivateMessage = model<IPrivateMessage>('PrivateMessage', privateMessageSchema);
