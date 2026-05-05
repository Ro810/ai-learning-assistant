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
  parentId?: Types.ObjectId;
}

export interface ISubject {
  _id: Types.ObjectId;
  name: string;
  code: string;
  description: string;
  topics: ITopic[];
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
  difficulty: 1 | 2 | 3;
  type: 'multiple_choice';
  content: {
    questionText: string;
    options?: IQuestionOption[];
    correctAnswer: string;
    explanation: string;
  };
  metadata: {
    generatedBy: 'gemini';
    generationPrompt: string;
    verified: boolean;
  };
  usageCount: number;
  createdAt: Date;
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
  status: 'in_progress' | 'completed' | 'abandoned';
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
