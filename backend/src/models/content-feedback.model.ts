// Phản hồi chất lượng nội dung do Gemini sinh (câu hỏi / lộ trình).
// Mỗi user chỉ 1 phản hồi cho 1 nội dung (unique userId+targetType+targetId) → upsert.

import mongoose, { Schema, Document } from 'mongoose';

export interface IContentFeedbackDocument extends Document {
  userId: mongoose.Types.ObjectId;
  targetType: 'question' | 'learning_path';
  targetId: mongoose.Types.ObjectId;
  rating: 'up' | 'down';
  reason?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const ContentFeedbackSchema = new Schema<IContentFeedbackDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    targetType: {
      type: String,
      enum: ['question', 'learning_path'],
      required: true,
    },
    targetId: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    rating: {
      type: String,
      enum: ['up', 'down'],
      required: true,
    },
    // Lý do khi 'down' (báo câu sai/khó hiểu) — tùy chọn.
    reason: {
      type: String,
      default: null,
      maxlength: 500,
    },
  },
  { timestamps: true }
);

// 1 user / 1 nội dung → 1 phản hồi (re-vote = update).
ContentFeedbackSchema.index({ userId: 1, targetType: 1, targetId: 1 }, { unique: true });
// Tra cứu tổng hợp theo nội dung (đếm up/down để lọc câu kém).
ContentFeedbackSchema.index({ targetType: 1, targetId: 1 });

export const ContentFeedback = mongoose.model<IContentFeedbackDocument>(
  'ContentFeedback',
  ContentFeedbackSchema,
);
