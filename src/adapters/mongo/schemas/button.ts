import mongoose, { Document, Schema } from 'mongoose';

export interface ButtonDocument extends Document {
  customId: string;
  actionName: string;
  attachId: string;
  createdAt: Date;
}

const ButtonSchema = new Schema<ButtonDocument>(
  {
    customId: { type: String, required: true, unique: true },
    actionName: { type: String, required: true },
    attachId: { type: String, required: true },
  },
  {
    timestamps: {
      createdAt: 'createdAt',
    },
  },
);

ButtonSchema.index({ actionName: 1 });

export const ButtonModel = mongoose.model<ButtonDocument>(
  'Button',
  ButtonSchema,
);
