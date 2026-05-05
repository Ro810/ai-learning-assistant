// Thin service wrappers around api-client. Each function returns the
// `data` field of backend's `{ success, data }` envelope so callers
// don't need to unwrap repeatedly.

import { api } from './api-client';
import type {
  Assessment,
  AssessmentSummary,
  AuthResponse,
  LearningPathSummary,
  PracticeSessionSummary,
  Subject,
  User,
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
};

// ----- Practice Sessions -----

export const practiceApi = {
  list: async () => {
    const res = await api.get<Envelope<{ sessions: PracticeSessionSummary[] }>>(
      '/practice-sessions',
    );
    return unwrap(res.data).sessions;
  },
};
