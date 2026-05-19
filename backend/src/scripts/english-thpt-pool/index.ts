// Pool types + re-exports for english-thpt question pool.
// Difficulty is assigned at seed time per PART_PLAN — NOT stored in template.

export interface QuestionTemplate {
  questionText: string;
  options: Array<{ id: 'A' | 'B' | 'C' | 'D'; text: string; isCorrect: boolean }>;
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  explanation: string;
}

export interface ReadingPassage {
  passage: string;
  questions: QuestionTemplate[]; // 7 câu mỗi passage
}

export { phoneticsPool } from './phonetics';
export { grammarPool } from './grammar';
export { vocabularyPool } from './vocabulary';
export { errorSpottingPool } from './error-spotting';
export { sentenceRewritePool } from './sentence-rewrite';
export { readingPool } from './reading';
