// TestPack model: 1 đề thi pre-seed thuộc 1 subject.
// Câu hỏi link ngược qua Question.packId — không lưu mảng questionIds ở đây.
// Index unique (subjectId, order) để seed script upsert idempotent.

import mongoose, { Schema, Document } from 'mongoose';
import { ITestPack } from '../types';

export interface ITestPackDocument extends Omit<ITestPack, '_id'>, Document {}

const TestPackSchema = new Schema<ITestPackDocument>(
  {
    subjectId: {
      type: Schema.Types.ObjectId,
      ref: 'Subject',
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    order: {
      type: Number,
      required: true,
      min: 1,
    },
    description: {
      type: String,
      default: '',
    },
    totalQuestions: {
      type: Number,
      required: true,
      default: 0,
    },
  },
  { timestamps: true }
);

TestPackSchema.index({ subjectId: 1, order: 1 }, { unique: true });
TestPackSchema.index({ subjectId: 1 });

export const TestPack = mongoose.model<ITestPackDocument>('TestPack', TestPackSchema);
