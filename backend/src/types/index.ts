import { Types, Document } from 'mongoose';

// User Types
export interface IUser {
  _id: Types.ObjectId;
  email: string;
  passwordHash: string;
  profile: {
    name: string;
    avatarUrl?: string;
    grade?: string;
  };
  learningGoals: Array<{
    subjectId: Types.ObjectId;
    targetLevel: 'basic' | 'intermediate' | 'advanced';
    targetDate: Date;
  }>;
  currentLevel?: {
    subjectId: Types.ObjectId;
    level: string;
    weakTopics: Types.ObjectId[];
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserDocument extends Document {
  _id: Types.ObjectId;
  email: string;
  passwordHash: string;
  profile: {
    name: string;
    avatarUrl?: string;
    grade?: string;
  };
  learningGoals: Array<{
    subjectId: Types.ObjectId;
    targetLevel: 'basic' | 'intermediate' | 'advanced';
    targetDate: Date;
  }>;
  currentLevel?: string;
  createdAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

export interface IUserInput {
  email: string;
  password: string;
  name: string;
  grade?: string;
}

// Subject Types
export interface ITopic {
  _id: Types.ObjectId;
  name: string;
  // Mô tả ngắn cho từng topic — dùng làm subtitle trong card grid.
  description?: string;
  // Tóm tắt kiến thức dài hơn, multiline (mỗi dòng = 1 bullet) — dùng cho study view.
  summary?: string;
  parentId?: Types.ObjectId;
}

export interface ISubject {
  _id: Types.ObjectId;
  name: string;
  code: string;
  description: string;
  topics: ITopic[];
  // True nếu môn đã bị remove khỏi CATALOG nhưng giữ lại để legacy assessment vẫn lookup được.
  deprecated?: boolean;
}

// Question Types
export interface IQuestionOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface IQuestion {
  _id: Types.ObjectId;
  topicIds: Types.ObjectId[];
  // Link to a pre-seeded TestPack. Null/undefined cho AI-generated questions.
  packId?: Types.ObjectId | null;
  difficulty: 1 | 2 | 3;
  type: 'multiple_choice';
  content: {
    questionText: string;
    options?: IQuestionOption[];
    correctAnswer: string;
    explanation: string;
  };
  metadata: {
    generatedBy: 'gemini' | 'seed';
    generationPrompt: string;
    verified: boolean;
  };
  usageCount: number;
  createdAt: Date;
}

// TestPack — 1 đề thi pre-seed thuộc 1 subject (vd: English THPT Đề 1).
export interface ITestPack {
  _id: Types.ObjectId;
  subjectId: Types.ObjectId;
  name: string;
  order: number;
  description?: string;
  totalQuestions: number;
  createdAt: Date;
  updatedAt: Date;
}

// Assessment Types
export interface IAssessmentQuestion {
  questionId: Types.ObjectId;
  questionSnapshot: Partial<IQuestion>;
  userAnswer?: string;
  isCorrect?: boolean;
  timeSpentSeconds?: number;
}

export interface IAssessment {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  subjectId: Types.ObjectId;
  // Tham chiếu TestPack nếu assessment được tạo từ 1 đề pre-seed; null cho AI flow cũ.
  packId?: Types.ObjectId | null;
  status: 'in_progress' | 'completed' | 'abandoned';
  difficulty?: 1 | 2 | 3;
  questions: IAssessmentQuestion[];
  results?: {
    score: number;
    correctCount: number;
    totalQuestions: number;
    skillAnalysis: Array<{
      topicId: Types.ObjectId;
      correct: number;
      total: number;
      level: string;
    }>;
    recommendedLevel: string;
  };
  completedAt?: Date;
  createdAt: Date;
}

// Auth Types
export interface IAuthPayload {
  userId: string;
  email: string;
}

export interface IAuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
  };
}
