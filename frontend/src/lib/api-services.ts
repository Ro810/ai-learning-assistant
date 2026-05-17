// Thin service wrappers around api-client. Each function returns the
// `data` field of backend's `{ success, data }` envelope so callers
// don't need to unwrap repeatedly.

import { api } from './api-client';
import type {
  Assessment,
  AssessmentSummary,
  AuthResponse,
  LearningPath,
  LearningPathSummary,
  PracticeSession,
  PracticeSessionSummary,
  Subject,
  User,
  WeakTopicItem,
} from './types';

interface Envelope<T> {
  success: boolean;
  data: T;
  message?: string;
}

const unwrap = <T,>(payload: Envelope<T>): T => payload.data;

// ----- Auth -----

export const authApi = {
  register: async (input: { email: string; password: string; name: string }) => {
    const res = await api.post<Envelope<AuthResponse>>('/auth/register', input);
    return unwrap(res.data);
  },
  login: async (input: { email: string; password: string }) => {
    const res = await api.post<Envelope<AuthResponse>>('/auth/login', input);
    return unwrap(res.data);
  },
  me: async () => {
    const res = await api.get<Envelope<User>>('/auth/me');
    return unwrap(res.data);
  },
  changePassword: async (input: { currentPassword: string; newPassword: string }) => {
    await api.patch('/auth/password', input);
  },
};

// ----- Subjects -----

export const subjectApi = {
  list: async () => {
    const res = await api.get<Envelope<{ subjects: Subject[] }>>('/subjects');
    return unwrap(res.data).subjects;
  },
  get: async (id: string) => {
    const res = await api.get<Envelope<{ subject: Subject }>>(`/subjects/${id}`);
    return unwrap(res.data).subject;
  },
};

// ----- Assessments -----

export const assessmentApi = {
  list: async (params?: { status?: string; subjectId?: string }) => {
    const res = await api.get<Envelope<{ assessments: AssessmentSummary[] }>>(
      '/assessments',
      { params },
    );
    return unwrap(res.data).assessments;
  },
  get: async (id: string) => {
    const res = await api.get<Envelope<{ assessment: Assessment }>>(
      `/assessments/${id}`,
    );
    return unwrap(res.data).assessment;
  },
  create: async (input: {
    subjectId: string;
    topicIds?: string[];
    difficulty?: 1 | 2 | 3;
    questionCount?: number;
  }) => {
    const res = await api.post<Envelope<{ assessment: Assessment }>>(
      '/assessments',
      input,
    );
    return unwrap(res.data).assessment;
  },
  submit: async (
    id: string,
    answers: Array<{ questionId: string; answer: string; timeSpentSeconds?: number }>,
  ) => {
    const res = await api.post<Envelope<{ assessment: Assessment }>>(
      `/assessments/${id}/submit`,
      { answers },
    );
    return unwrap(res.data).assessment;
  },
  abandon: async (id: string) => {
    await api.post(`/assessments/${id}/abandon`);
  },
};

// ----- Learning Paths -----

export const learningPathApi = {
  list: async () => {
    const res = await api.get<Envelope<{ learningPaths: LearningPathSummary[] }>>(
      '/learning-paths',
    );
    return unwrap(res.data).learningPaths;
  },
  get: async (id: string) => {
    const res = await api.get<Envelope<{ learningPath: LearningPath }>>(
      `/learning-paths/${id}`,
    );
    return unwrap(res.data).learningPath;
  },
  create: async (input: {
    assessmentId: string;
    targetLevel: 'basic' | 'intermediate' | 'advanced';
    targetDate: string;
  }) => {
    const res = await api.post<Envelope<{ learningPath: LearningPath }>>(
      '/learning-paths',
      input,
    );
    return unwrap(res.data).learningPath;
  },
  update: async (id: string, input: { milestoneIndex: number; completed: boolean }) => {
    const res = await api.put<Envelope<{ learningPath: LearningPath }>>(
      `/learning-paths/${id}`,
      input,
    );
    return unwrap(res.data).learningPath;
  },
  delete: async (id: string) => {
    await api.delete(`/learning-paths/${id}`);
  },
};

// ----- Practice Sessions -----

export const practiceApi = {
  list: async () => {
    const res = await api.get<Envelope<{ sessions: PracticeSessionSummary[] }>>(
      '/practice-sessions',
    );
    return unwrap(res.data).sessions;
  },
  get: async (id: string) => {
    const res = await api.get<Envelope<{ session: PracticeSession }>>(
      `/practice-sessions/${id}`,
    );
    return unwrap(res.data).session;
  },
  create: async (input: {
    subjectId: string;
    topicIds?: string[];
    mode: 'adaptive' | 'exam_simulation';
    questionCount: number;
  }) => {
    const res = await api.post<Envelope<{ session: PracticeSession }>>(
      '/practice-sessions',
      input,
    );
    return unwrap(res.data).session;
  },
  answer: async (
    id: string,
    payload: { questionId: string; answer: string; timeSpentSeconds?: number },
  ) => {
    const res = await api.post<Envelope<{ session: PracticeSession }>>(
      `/practice-sessions/${id}/answer`,
      payload,
    );
    return unwrap(res.data).session;
  },
  finish: async (id: string) => {
    const res = await api.post<Envelope<{ session: PracticeSession }>>(
      `/practice-sessions/${id}/finish`,
    );
    return unwrap(res.data).session;
  },
  abandon: async (id: string) => {
    await api.post(`/practice-sessions/${id}/abandon`);
  },
  getWeakTopics: async () => {
    const res = await api.get<Envelope<{ items: WeakTopicItem[] }>>(
      '/practice-sessions/analytics/weak-topics',
    );
    return unwrap(res.data).items;
  },
};

// ----- User -----

export const userApi = {
  updateProfile: async (input: { name?: string; grade?: string; avatarUrl?: string }) => {
    const res = await api.patch<Envelope<{ user: User }>>('/users/me', input);
    return unwrap(res.data).user;
  },
  addLearningGoal: async (input: {
    subjectId: string;
    targetLevel: string;
    targetDate: string;
  }) => {
    const res = await api.post<Envelope<{ user: User }>>('/users/me/learning-goals', input);
    return unwrap(res.data).user;
  },
  removeLearningGoal: async (subjectId: string) => {
    const res = await api.delete<Envelope<{ user: User }>>(
      `/users/me/learning-goals/${subjectId}`,
    );
    return unwrap(res.data).user;
  },
};
