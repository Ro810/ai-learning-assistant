// Question selector for practice sessions: prefers reusing the existing
// question bank to control AI cost, falls back to AI generation only when
// the bank can't fully cover the requested count.

import mongoose from 'mongoose';
import { Question } from '../models/question.model';
import { questionGenerator } from './question-generator.service';

interface SelectInput {
  topicIds: string[];
  difficultyRange: [number, number];
  count: number;
  subjectId?: string;
}

// Returns full Question docs (with correctAnswer) so the caller can both
// snapshot grading info and strip the answer key before responding.
export const selectQuestions = async (input: SelectInput): Promise<any[]> => {
  const [minDiff, maxDiff] = input.difficultyRange;
  const topicObjectIds = input.topicIds.map((id) => new mongoose.Types.ObjectId(id));

  // Bank-first: prefer least-used questions so the pool stays varied across
  // sessions. Sort by usageCount asc, fall back to random-ish via createdAt.
  const bankQuestions = await Question.find({
    topicIds: { $in: topicObjectIds },
    difficulty: { $gte: minDiff, $lte: maxDiff },
  })
    .sort({ usageCount: 1, createdAt: -1 })
    .limit(input.count);

  if (bankQuestions.length >= input.count) {
    return bankQuestions.slice(0, input.count);
  }

  // Shortfall — generate the missing delta via AI. If AI fails entirely,
  // surface the error so the controller can return 502; the partial bank
  // answer is acceptable degradation only when AI succeeds returning < delta.
  const missing = input.count - bankQuestions.length;
  const targetDifficulty = Math.round((minDiff + maxDiff) / 2) as 1 | 2 | 3;

  const generated = await questionGenerator.generate({
    subjectId: input.subjectId ?? '',
    topicIds: input.topicIds,
    difficulty: clampDifficulty(targetDifficulty),
    count: missing,
    questionType: 'multiple_choice',
  });

  return [...bankQuestions, ...generated];
};

const clampDifficulty = (d: number): 1 | 2 | 3 => {
  if (d <= 1) return 1;
  if (d >= 3) return 3;
  return 2;
};
