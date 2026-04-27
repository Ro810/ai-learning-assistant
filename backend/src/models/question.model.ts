import mongoose, { Schema, Document } from 'mongoose';
import { IQuestion } from '../types';

export interface IQuestionDocument extends IQuestion, Document {}

const QuestionOptionSchema = new Schema(
  {
    id: {
      type: String,
      required: true,
    },
    text: {
      type: String,
      required: true,
    },
    isCorrect: {
      type: Boolean,
      required: true,
    },
  },
  { _id: false }
);

const QuestionSchema = new Schema<IQuestionDocument>(
  {
    // Topic IDs are subdocument _ids inside Subject.topics — no Mongoose ref
    topicIds: {
      type: [Schema.Types.ObjectId],
      required: [true, 'At least one topic is required'],
      validate: [(arr: unknown[]) => arr.length > 0, 'At least one topic is required'],
    },
    difficulty: {
      type: Number,
      required: [true, 'Difficulty is required'],
      enum: [1, 2, 3],
      default: 1,
    },
    type: {
      type: String,
      required: [true, 'Question type is required'],
      enum: ['multiple_choice'],
      default: 'multiple_choice',
    },
    content: {
      questionText: {
        type: String,
        required: [true, 'Question text is required'],
      },
      options: [QuestionOptionSchema],
      correctAnswer: {
        type: String,
        required: [true, 'Correct answer is required'],
      },
      explanation: {
        type: String,
        required: [true, 'Explanation is required'],
      },
    },
    metadata: {
      generatedBy: {
        type: String,
        enum: ['claude', 'gpt'],
        required: true,
      },
      generationPrompt: {
        type: String,
        required: true,
      },
      verified: {
        type: Boolean,
        default: false,
      },
    },
    usageCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient querying
QuestionSchema.index({ topicIds: 1, difficulty: 1 });
QuestionSchema.index({ difficulty: 1 });
QuestionSchema.index({ usageCount: -1 });
QuestionSchema.index({ 'content.questionText': 'text' });

export const Question = mongoose.model<IQuestionDocument>('Question', QuestionSchema);
