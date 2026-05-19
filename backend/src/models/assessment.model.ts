import mongoose, { Schema, Document } from 'mongoose';
import { IAssessment } from '../types';

export interface IAssessmentDocument extends IAssessment, Document {}

const AssessmentQuestionSchema = new Schema(
  {
    questionId: {
      type: Schema.Types.ObjectId,
      ref: 'Question',
      required: true,
    },
    questionSnapshot: {
      type: Schema.Types.Mixed,
      required: true,
    },
    userAnswer: {
      type: String,
      default: null,
    },
    isCorrect: {
      type: Boolean,
      default: null,
    },
    timeSpentSeconds: {
      type: Number,
      default: null,
    },
  },
  { _id: false }
);

const SkillAnalysisSchema = new Schema(
  {
    topicId: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    correct: {
      type: Number,
      required: true,
    },
    total: {
      type: Number,
      required: true,
    },
    level: {
      type: String,
      required: true,
    },
  },
  { _id: false }
);

const AssessmentSchema = new Schema<IAssessmentDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    subjectId: {
      type: Schema.Types.ObjectId,
      ref: 'Subject',
      required: [true, 'Subject ID is required'],
    },
    // Link tới TestPack nếu assessment tạo từ đề pre-seed. AI flow giữ null.
    packId: {
      type: Schema.Types.ObjectId,
      ref: 'TestPack',
      default: null,
      index: true,
    },
    status: {
      type: String,
      enum: ['in_progress', 'completed', 'abandoned'],
      default: 'in_progress',
    },
    // Mức độ khó người dùng chọn khi bắt đầu (1=Cơ bản, 2=Trung bình, 3=Nâng cao).
    // Không set default — bài cũ chưa có field này sẽ là undefined và UI ẩn cột trình độ.
    difficulty: {
      type: Number,
      enum: [1, 2, 3],
    },
    questions: [AssessmentQuestionSchema],
    results: {
      score: Number,
      correctCount: Number,
      totalQuestions: Number,
      skillAnalysis: [SkillAnalysisSchema],
      recommendedLevel: String,
    },
    completedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
AssessmentSchema.index({ userId: 1, createdAt: -1 });
AssessmentSchema.index({ userId: 1, subjectId: 1, status: 1 });

export const Assessment = mongoose.model<IAssessmentDocument>('Assessment', AssessmentSchema);
