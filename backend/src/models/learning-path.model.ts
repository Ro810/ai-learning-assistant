import mongoose, { Schema, Document } from 'mongoose';

export interface ILearningPathDocument extends Document {
  userId: mongoose.Types.ObjectId;
  subjectId: mongoose.Types.ObjectId;
  basedOnAssessmentId: mongoose.Types.ObjectId;
  status: 'active' | 'completed' | 'paused';
  startDate: Date;
  targetDate: Date;
  milestones: Array<{
    title: string;
    topicIds: mongoose.Types.ObjectId[];
    difficulty: number;
    estimatedDays: number;
    resources: Array<{
      type: 'video' | 'article' | 'exercise';
      title: string;
      url?: string;
    }>;
    completedAt?: Date;
    completionRate: number;
  }>;
  progressPercent: number;
  createdAt: Date;
  updatedAt: Date;
}

const ResourceSchema = new Schema(
  {
    type: {
      type: String,
      enum: ['video', 'article', 'exercise'],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    url: {
      type: String,
      default: null,
    },
  },
  { _id: false }
);

const MilestoneSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
    },
    topicIds: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Subject.topics',
      },
    ],
    difficulty: {
      type: Number,
      required: true,
    },
    estimatedDays: {
      type: Number,
      required: true,
    },
    resources: [ResourceSchema],
    completedAt: {
      type: Date,
      default: null,
    },
    completionRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
  },
  { _id: true }
);

const LearningPathSchema = new Schema<ILearningPathDocument>(
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
    basedOnAssessmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Assessment',
      required: [true, 'Assessment ID is required'],
    },
    status: {
      type: String,
      enum: ['active', 'completed', 'paused'],
      default: 'active',
    },
    startDate: {
      type: Date,
      required: true,
    },
    targetDate: {
      type: Date,
      required: true,
    },
    milestones: [MilestoneSchema],
    progressPercent: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
LearningPathSchema.index({ userId: 1, status: 1 });
LearningPathSchema.index({ userId: 1, subjectId: 1 });

export const LearningPath = mongoose.model<ILearningPathDocument>('LearningPath', LearningPathSchema);
