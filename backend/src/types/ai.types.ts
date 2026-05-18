// AI Types

export interface IAIProvider {
  generateContent(prompt: string): Promise<string>;
}

export interface IGenerateQuestionsInput {
  subjectId: string;
  topicIds: string[];
  difficulty: 1 | 2 | 3;
  count: number;
  questionType: 'multiple_choice';
}

export interface IQuestionPromptData {
  topic: string;
  difficulty: 1 | 2 | 3;
  count: number;
  questionType: 'multiple_choice';
}

export interface ILearningPathPromptData {
  assessmentResult: {
    strengths: string[];
    weaknesses: string[];
    currentLevel: string;
  };
  targetLevel: 'basic' | 'intermediate' | 'advanced';
  targetDate: string;
  weeklyHours: number;
}

export interface IGenerateLearningPathInput {
  subjectId: string;
  // Cho phép 1-3 bài đánh giá để tổng hợp điểm mạnh/yếu.
  assessmentIds: string[];
  targetDate: string;
  targetLevel: 'basic' | 'intermediate' | 'advanced';
  weeklyStudyHours: number;
}

export interface IMilestoneInput {
  title: string;
  topicIds: string[];
  difficulty: number;
  estimatedDays: number;
  resources: Array<{
    type: 'video' | 'article' | 'exercise';
    title: string;
    url?: string;
  }>;
}

export type AIProviderType = 'gemini';
