// Pure grading functions for multiple-choice assessments. No DB, no I/O.
// Kept separate from the controller so unit tests can exercise scoring logic
// without spinning up Express or Mongo.

import { Types } from 'mongoose';

export interface AnswerInput {
  questionId: string;
  answer: string;
  timeSpentSeconds?: number;
}

export interface GradedQuestion {
  questionId: Types.ObjectId;
  questionSnapshot: any;
  userAnswer: string | null;
  isCorrect: boolean;
  timeSpentSeconds: number | null;
}

export interface SkillAnalysisItem {
  topicId: Types.ObjectId;
  correct: number;
  total: number;
  level: 'basic' | 'intermediate' | 'advanced';
}

// Grade snapshots against submitted answers. Unanswered or unknown questions
// default to isCorrect=false so they still count toward the denominator.
export const gradeAnswers = (
  snapshots: Array<{ questionId: Types.ObjectId; questionSnapshot: any }>,
  answers: AnswerInput[],
): GradedQuestion[] => {
  const answerMap = new Map<string, AnswerInput>();
  for (const a of answers) {
    answerMap.set(a.questionId, a);
  }

  return snapshots.map((s) => {
    const submitted = answerMap.get(s.questionId.toString());
    const userAnswer = submitted?.answer ?? null;
    const correctAnswer = s.questionSnapshot?.content?.correctAnswer;
    const isCorrect = userAnswer !== null && userAnswer === correctAnswer;

    return {
      questionId: s.questionId,
      questionSnapshot: s.questionSnapshot,
      userAnswer,
      isCorrect,
      timeSpentSeconds: submitted?.timeSpentSeconds ?? null,
    };
  });
};

// Bucket graded questions by their first topicId (assumption: questions are
// authored against a single primary topic). Topics with zero questions are
// excluded from the analysis to avoid divide-by-zero downstream.
export const buildSkillAnalysis = (graded: GradedQuestion[]): SkillAnalysisItem[] => {
  const buckets = new Map<string, { topicId: Types.ObjectId; correct: number; total: number }>();

  for (const g of graded) {
    const topicIds: any[] = g.questionSnapshot?.topicIds ?? [];
    if (topicIds.length === 0) continue;
    const primaryTopicId = topicIds[0];
    const key = primaryTopicId.toString();

    const bucket = buckets.get(key) ?? {
      topicId: new Types.ObjectId(key),
      correct: 0,
      total: 0,
    };
    bucket.total += 1;
    if (g.isCorrect) bucket.correct += 1;
    buckets.set(key, bucket);
  }

  return Array.from(buckets.values()).map((b) => ({
    topicId: b.topicId,
    correct: b.correct,
    total: b.total,
    level: ratioToLevel(b.correct / b.total),
  }));
};

// Pick the most common per-topic level as the overall recommendation.
// Falls back to 'basic' when there's no signal (empty analysis).
export const deriveRecommendedLevel = (
  skillAnalysis: SkillAnalysisItem[],
): 'basic' | 'intermediate' | 'advanced' => {
  if (skillAnalysis.length === 0) return 'basic';

  const counts: Record<string, number> = { basic: 0, intermediate: 0, advanced: 0 };
  for (const s of skillAnalysis) counts[s.level] += 1;

  let bestLevel: 'basic' | 'intermediate' | 'advanced' = 'basic';
  let bestCount = -1;
  for (const level of ['advanced', 'intermediate', 'basic'] as const) {
    if (counts[level] > bestCount) {
      bestLevel = level;
      bestCount = counts[level];
    }
  }
  return bestLevel;
};

const ratioToLevel = (ratio: number): 'basic' | 'intermediate' | 'advanced' => {
  if (ratio >= 0.8) return 'advanced';
  if (ratio >= 0.5) return 'intermediate';
  return 'basic';
};
