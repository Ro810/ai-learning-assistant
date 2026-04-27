// Pure helpers for practice-session lifecycle. No DB access.

import { Types } from 'mongoose';

export interface AdaptiveState {
  currentDifficulty: number;
  consecutiveCorrect: number;
  consecutiveWrong: number;
}

const DIFFICULTY_MIN = 1;
const DIFFICULTY_MAX = 3;
const STREAK_THRESHOLD = 2;

// Adaptive rule: 2 correct in a row → diff++, 2 wrong in a row → diff--.
// Bounded at [1, 3]. exam_simulation mode is fixed-difficulty, so no change.
export const applyAdaptive = (
  state: AdaptiveState,
  isCorrect: boolean,
  mode: 'adaptive' | 'exam_simulation',
): AdaptiveState => {
  if (mode !== 'adaptive') return state;

  const next: AdaptiveState = {
    currentDifficulty: state.currentDifficulty,
    consecutiveCorrect: isCorrect ? state.consecutiveCorrect + 1 : 0,
    consecutiveWrong: isCorrect ? 0 : state.consecutiveWrong + 1,
  };

  if (next.consecutiveCorrect >= STREAK_THRESHOLD) {
    next.currentDifficulty = Math.min(DIFFICULTY_MAX, next.currentDifficulty + 1);
    next.consecutiveCorrect = 0;
  } else if (next.consecutiveWrong >= STREAK_THRESHOLD) {
    next.currentDifficulty = Math.max(DIFFICULTY_MIN, next.currentDifficulty - 1);
    next.consecutiveWrong = 0;
  }

  return next;
};

export interface PracticeResults {
  score: number;
  accuracyPercent: number;
  avgTimePerQuestion: number;
  weakTopicIds: Types.ObjectId[];
}

interface SessionForResults {
  questions: Array<{
    isCorrect?: boolean | null;
    timeSpentSeconds?: number | null;
    questionSnapshot?: { topicIds?: any[] };
  }>;
}

// Compute final results. weakTopicIds = topics where accuracy < 0.5 in this
// session. Empty topics are ignored. Snapshot may be missing for sessions
// where we only stored questionId; in that case the caller is responsible
// for hydrating topic info before calling this.
export const computePracticeResults = (
  session: { questions: any[] },
  topicLookup: Map<string, Types.ObjectId[]>,
): PracticeResults => {
  const total = session.questions.length;
  const correct = session.questions.filter((q) => q.isCorrect === true).length;
  const totalTime = session.questions.reduce(
    (sum, q) => sum + (q.timeSpentSeconds ?? 0),
    0,
  );

  const buckets = new Map<string, { correct: number; total: number; topicId: Types.ObjectId }>();
  for (const q of session.questions) {
    const topicIds = topicLookup.get(q.questionId?.toString?.() ?? '') ?? [];
    if (topicIds.length === 0) continue;
    const primary = topicIds[0];
    const key = primary.toString();
    const bucket = buckets.get(key) ?? { correct: 0, total: 0, topicId: primary };
    bucket.total += 1;
    if (q.isCorrect) bucket.correct += 1;
    buckets.set(key, bucket);
  }

  const weakTopicIds = Array.from(buckets.values())
    .filter((b) => b.total > 0 && b.correct / b.total < 0.5)
    .map((b) => b.topicId);

  return {
    score: total > 0 ? Math.round((correct / total) * 100) : 0,
    accuracyPercent: total > 0 ? Math.round((correct / total) * 100) : 0,
    avgTimePerQuestion: total > 0 ? Math.round(totalTime / total) : 0,
    weakTopicIds,
  };
};
