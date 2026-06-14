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
  PackDetail,
  PracticeSession,
  PracticeSessionSummary,
  Subject,
  TestPack,
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
  // Quên mật khẩu: yêu cầu gửi link. Dev (chưa có SMTP) trả về resetUrl để test.
  forgotPassword: async (email: string) => {
    const res = await api.post<Envelope<{ resetUrl?: string }>>(
      '/auth/forgot-password',
      { email },
    );
    return unwrap(res.data);
  },
  resetPassword: async (input: { token: string; newPassword: string }) => {
    await api.post('/auth/reset-password', input);
  },
};

// ----- Subjects -----

export const subjectApi = {
  // withTopics=true để lấy kèm mảng topics (cho UI chọn chủ đề). Mặc định
  // backend chỉ trả topicCount để response nhẹ.
  list: async (params?: { withTopics?: boolean }) => {
    const query = params?.withTopics ? '?withTopics=true' : '';
    const res = await api.get<Envelope<{ subjects: Subject[] }>>(`/subjects${query}`);
    return unwrap(res.data).subjects;
  },
  get: async (id: string) => {
    const res = await api.get<Envelope<{ subject: Subject }>>(`/subjects/${id}`);
    return unwrap(res.data).subject;
  },
};

// ----- Packs -----

export const packApi = {
  listBySubject: async (subjectId: string) => {
    const res = await api.get<Envelope<{ packs: TestPack[] }>>(`/subjects/${subjectId}/packs`);
    return unwrap(res.data).packs;
  },
  get: async (packId: string) => {
    const res = await api.get<Envelope<PackDetail>>(`/packs/${packId}`);
    return unwrap(res.data);
  },
  // Sinh động 1 pack mới cho subject (chỉ math-thpt). Tốn ~30-60s.
  generateForSubject: async (subjectId: string) => {
    const res = await api.post<Envelope<{ pack: TestPack; generated: number; failed: number }>>(
      `/subjects/${subjectId}/generate-pack`,
    );
    return unwrap(res.data);
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
    packId?: string;
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
    // Cho phép 1-3 bài đánh giá cùng môn — backend sẽ tổng hợp điểm mạnh/yếu.
    assessmentIds: string[];
    targetLevel: 'basic' | 'intermediate' | 'advanced';
    targetDate: string;
    // Giờ học/tuần — backend dùng để cân estimatedDays cho mỗi milestone.
    weeklyStudyHours?: number;
  }) => {
    const res = await api.post<Envelope<{ learningPath: LearningPath }>>(
      '/learning-paths',
      input,
    );
    return unwrap(res.data).learningPath;
  },
  update: async (
    id: string,
    input: {
      milestoneId: string;
      // 'complete' tick xong, 'uncomplete' bỏ tick, 'update_progress' set %
      action: 'complete' | 'uncomplete' | 'update_progress';
      completionRate?: number;
    },
  ) => {
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
    // Liên kết chặng lộ trình (tùy chọn) — để hiện tên chặng + tự tick khi xong.
    learningPathId?: string;
    milestoneId?: string;
    label?: string;
  }) => {
    const { questionCount, topicIds, ...rest } = input;
    const res = await api.post<Envelope<{ session: PracticeSession }>>(
      '/practice-sessions',
      // Backend nhận topicIds + settings.questionCount.
      { ...rest, topicIds, settings: { questionCount } },
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
  // Ôn lại câu sai THEO MÔN — backend gom câu sai của môn đó từ các bài đã hoàn thành.
  reviewWrong: async (subjectId: string) => {
    const res = await api.post<Envelope<{ session: PracticeSession }>>(
      '/practice-sessions/review-wrong',
      { subjectId },
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
    return unwrap(res.data).items ?? [];
  },
};

// ----- User -----

export const userApi = {
  updateProfile: async (input: { name?: string; grade?: string; avatarUrl?: string }) => {
    // Backend expects { profile: { ... } } — see updateProfileSchema in
    // backend/src/controllers/user.controller.ts (uses .strict()).
    const res = await api.patch<Envelope<{ user: User }>>('/users/me', { profile: input });
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
