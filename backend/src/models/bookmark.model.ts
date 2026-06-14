// Đánh dấu (bookmark) câu hỏi hay để xem lại. 1 user + 1 question = 1 bookmark.

import mongoose, { Schema, Document } from 'mongoose';

export interface IBookmarkDocument extends Document {
  userId: mongoose.Types.ObjectId;
  questionId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const BookmarkSchema = new Schema<IBookmarkDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    questionId: { type: Schema.Types.ObjectId, ref: 'Question', required: true },
  },
  { timestamps: true }
);

BookmarkSchema.index({ userId: 1, questionId: 1 }, { unique: true });
BookmarkSchema.index({ userId: 1, createdAt: -1 });

export const Bookmark = mongoose.model<IBookmarkDocument>('Bookmark', BookmarkSchema);
