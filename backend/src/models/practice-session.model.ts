import mongoose, { Schema, Document } from 'mongoose';

export interface IPracticeSessionDocument extends Document {
  userId: mongoose.Types.ObjectId;
  topicIds: mongoose.Types.ObjectId[];
  // Liên kết tùy chọn tới 1 chặng lộ trình — khi phiên được tạo từ màn học chặng.
  // Dùng để hiện tên chặng + tự đánh dấu hoàn thành chặng khi kết thúc phiên.
  learningPathId?: mongoose.Types.ObjectId;
  milestoneId?: mongoose.Types.ObjectId;
  label?: string;
  mode: 'adaptive' | 'exam_simulation';
  settings: {
    questionCount: number;
    difficultyRange: [number, number];
    timeLimitMinutes?: number;
  };
  questions: Array<{
    questionId: mongoose.Types.ObjectId;
    order: number;
    userAnswer?: string;
    isCorrect?: boolean;
    timeSpentSeconds?: number;
    hintUsed?: boolean;
  }>;
  adaptiveState: {
    currentDifficulty: number;
    consecutiveCorrect: number;
    consecutiveWrong: number;
  };
  results?: {
    score: number;
    accuracyPercent: number;
    avgTimePerQuestion: number;
    weakTopicIds: mongoose.Types.ObjectId[];
  };
  status: 'in_progress' | 'completed' | 'abandoned';
  startedAt: Date;
  completedAt?: Date;
  createdAt: Date;
}

const PracticeQuestionSchema = new Schema(
  {
    questionId: {
      type: Schema.Types.ObjectId,
      ref: 'Question',
      required: true,
    },
    order: {
      type: Number,
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
    hintUsed: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false }
);

const AdaptiveStateSchema = new Schema(
  {
    currentDifficulty: {
      type: Number,
      default: 1,
    },
    consecutiveCorrect: {
      type: Number,
      default: 0,
    },
    consecutiveWrong: {
      type: Number,
      default: 0,
    },
  },
  { _id: false }
);

const PracticeSessionSchema = new Schema<IPracticeSessionDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    topicIds: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Subject.topics',
        required: [true, 'At least one topic is required'],
      },
    ],
    // Liên kết chặng lộ trình (tùy chọn).
    learningPathId: {
      type: Schema.Types.ObjectId,
      ref: 'LearningPath',
      default: null,
    },
    milestoneId: {
      type: Schema.Types.ObjectId,
      default: null,
    },
    label: {
      type: String,
      default: null,
    },
    mode: {
      type: String,
      enum: ['adaptive', 'exam_simulation'],
      required: true,
    },
    settings: {
      questionCount: {
        type: Number,
        required: true,
        default: 10,
      },
      difficultyRange: {
        type: [Number],
        validate: {
          validator: (v: number[]) => v.length === 2,
          message: 'Difficulty range must have exactly 2 values',
        },
        default: [1, 3],
      },
      timeLimitMinutes: {
        type: Number,
        default: null,
      },
    },
    questions: [PracticeQuestionSchema],
    adaptiveState: {
      type: AdaptiveStateSchema,
      default: () => ({}),
    },
    results: {
      score: Number,
      accuracyPercent: Number,
      avgTimePerQuestion: Number,
      weakTopicIds: [
        {
          type: Schema.Types.ObjectId,
          ref: 'Subject.topics',
        },
      ],
    },
    status: {
      type: String,
      enum: ['in_progress', 'completed', 'abandoned'],
      default: 'in_progress',
    },
    startedAt: {
      type: Date,
      default: Date.now,
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
PracticeSessionSchema.index({ userId: 1, startedAt: -1 });
PracticeSessionSchema.index({ userId: 1, status: 1 });

export const PracticeSession = mongoose.model<IPracticeSessionDocument>('PracticeSession', PracticeSessionSchema);
