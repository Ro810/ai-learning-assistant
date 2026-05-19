// Shared types mirroring backend response shapes (Week 1-4 contracts).
// Keep loose where backend returns optional/dynamic data.

export interface User {
  id: string;
  email: string;
  profile: {
    name: string;
    avatarUrl?: string;
    grade?: string;
  };
  learningGoals?: Array<{
    subjectId: string;
    targetLevel: string;
    targetDate?: string;
  }>;
  currentLevel?: {
    subjectId?: string;
    level?: string;
    weakTopics?: string[];
  };
  createdAt?: string;
}

// Backend register/login return a flat user (id, email, name).
// Full user object (with profile, learningGoals, currentLevel) is fetched
// from /auth/me afterwards.
export interface AuthResponse {
  token: string;
  user: { id: string; email: string; name: string };
}

export interface Topic {
  _id: string;
  name: string;
  description?: string;
  summary?: string;
  parentId?: string | null;
}

export interface Subject {
  _id: string;
  name: string;
  code: string;
  description?: string;
  topics: Topic[];
}

export interface QuestionOption {
  id: string;
  text: string;
}

export interface QuestionContent {
  questionText: string;
  options: QuestionOption[];
  correctAnswer?: string;
  explanation?: string;
}

export interface AssessmentQuestion {
  questionId: string;
  questionSnapshot: {
    _id?: string;
    topicIds?: string[];
    difficulty?: number;
    type?: string;
    content: QuestionContent;
  };
  userAnswer?: string | null;
  isCorrect?: boolean | null;
  timeSpentSeconds?: number | null;
}

export interface SkillAnalysisItem {
  topicId: string;
  correct: number;
  total: number;
  level: string;
}

export interface AssessmentResults {
  score: number;
  correctCount: number;
  totalQuestions: number;
  skillAnalysis: SkillAnalysisItem[];
  recommendedLevel: string;
}

export interface Assessment {
  _id: string;
  userId: string;
  subjectId: string;
  status: 'in_progress' | 'completed' | 'abandoned';
  difficulty?: 1 | 2 | 3;
  questions: AssessmentQuestion[];
  results?: AssessmentResults;
  completedAt?: string | null;
  createdAt: string;
}

export interface AssessmentSummary {
  _id: string;
  subjectId: string;
  status: 'in_progress' | 'completed' | 'abandoned';
  difficulty?: 1 | 2 | 3;
  results?: AssessmentResults;
  createdAt: string;
  completedAt?: string | null;
}

export interface LearningPathSummary {
  _id: string;
  userId: string;
  subjectId: string;
  targetLevel?: string;
  targetDate?: string;
  status?: string;
  milestones?: Array<{
    week?: number;
    title?: string;
    completed?: boolean;
  }>;
  createdAt: string;
}

export interface PracticeSessionSummary {
  _id: string;
  status: 'in_progress' | 'completed' | 'abandoned';
  mode?: string;
  results?: {
    score?: number;
    totalCorrect?: number;
    totalQuestions?: number;
  };
  createdAt: string;
}

// ----- Learning Path (full) -----

export interface LearningPathMilestone {
  week: number;
  topicIds: string[];
  difficulty: 1 | 2 | 3;
  estimatedDays: number;
  resources: string[];
  completed: boolean;
}

export interface LearningPath {
  _id: string;
  userId: string;
  subjectId: string;
  basedOnAssessmentId?: string;
  targetLevel: 'basic' | 'intermediate' | 'advanced';
  targetDate: string;
  milestones: LearningPathMilestone[];
  status: string;
  createdAt: string;
}

// ----- Practice Session (full) -----

export interface PracticeQuestion {
  questionId: string;
  questionSnapshot: {
    content: {
      questionText: string;
      options: Array<{ id: string; text: string }>;
      correctAnswer?: string;
      explanation?: string;
    };
  };
  userAnswer?: string | null;
  isCorrect?: boolean | null;
}

export interface PracticeSession {
  _id: string;
  userId: string;
  subjectId: string;
  mode: 'adaptive' | 'exam_simulation';
  status: 'in_progress' | 'completed' | 'abandoned';
  adaptiveState: {
    currentDifficulty: 1 | 2 | 3;
    consecutiveCorrect: number;
    consecutiveWrong: number;
  };
  questions: PracticeQuestion[];
  results?: {
    score: number;
    accuracy: number;
    totalCorrect: number;
    totalQuestions: number;
    avgTimePerQuestion: number;
  };
  createdAt: string;
}

// ----- Weak Topics -----

export interface WeakTopicItem {
  topicId: string;
  topicName?: string;
  subjectId: string;
  subjectName?: string;
  rate: number;
  correct: number;
  total: number;
}

export interface TestPack {
  _id: string;
  subjectId: string;
  name: string;
  order: number;
  totalQuestions: number;
  description?: string;
}

export interface PackPart {
  topicId: string;
  topicName: string;
  questionCount: number;
}

export interface PackProgressEntry {
  topicId: string;
  assessmentId: string;
  score: number;
}

export interface PackDetail {
  pack: TestPack;
  subject: { _id: string; name: string; code: string };
  parts: PackPart[];
  progress: PackProgressEntry[];
}

export interface ApiSuccess<T> {
  success: true;
  data: T;
  message?: string;
}

export interface ApiError {
  success: false;
  message: string;
  errors?: Array<{ message: string; path?: (string | number)[] }>;
  data?: { existingId?: string };
}
