// Idempotent seed script: tạo 10 TestPack + 400 Question cho môn Tiếng Anh THPT.
// Usage: npm run seed:english-thpt-packs
//
// Prerequisites:
//   - MONGODB_URI set in .env
//   - Subject 'english-thpt' already seeded (npm run seed:subjects)
//
// Safety:
//   - Refuses production unless ALLOW_PROD_SEED=1
//   - Delete-then-insertMany per pack → idempotent re-runs

import dotenv from 'dotenv';
dotenv.config();

import mongoose, { Types } from 'mongoose';
import { Subject } from '../models/subject.model';
import { TestPack } from '../models/test-pack.model';
import { Question } from '../models/question.model';
import {
  QuestionTemplate,
  ReadingPassage,
  phoneticsPool,
  grammarPool,
  vocabularyPool,
  errorSpottingPool,
  sentenceRewritePool,
  readingPool,
} from './english-thpt-pool/index';

// ---------------------------------------------------------------------------
// Part plan: 4 + 10 + 5 + 3 + 3 + 15 = 40 câu / pack
// ---------------------------------------------------------------------------
interface PartPlan {
  topicName: string;
  pool: QuestionTemplate[];
  count: number;
  difficulty: 1 | 2 | 3;
}

const PART_PLAN: PartPlan[] = [
  { topicName: 'Ngữ âm',      pool: phoneticsPool,      count: 4,  difficulty: 1 },
  { topicName: 'Ngữ pháp',    pool: grammarPool,        count: 10, difficulty: 2 },
  { topicName: 'Từ vựng',     pool: vocabularyPool,     count: 5,  difficulty: 1 },
  { topicName: 'Tìm lỗi sai', pool: errorSpottingPool,  count: 3,  difficulty: 3 },
  { topicName: 'Viết lại câu',pool: sentenceRewritePool, count: 3, difficulty: 3 },
  // Reading handled separately (15 câu từ passages)
];

const READING_TOPIC_NAME = 'Đọc hiểu';
const READING_DIFFICULTY: 1 | 2 | 3 = 2;
const READING_QUESTIONS_PER_PACK = 15;

// ---------------------------------------------------------------------------
// Rotation helpers
// ---------------------------------------------------------------------------

/** Pick `count` items from pool starting at deterministic offset for this pack. */
function pick<T>(pool: T[], packOrder: number, count: number): T[] {
  const start = ((packOrder - 1) * count) % pool.length;
  return Array.from({ length: count }, (_, i) => pool[(start + i) % pool.length]);
}

/**
 * Build 15 reading questions for a given pack order.
 * Uses 2 full passages (7 câu each = 14) + 1 câu đầu từ passage thứ 3.
 * Passage index wraps around readingPool length.
 */
function pickReadingQuestions(packOrder: number): Array<{ q: QuestionTemplate; passage: string }> {
  const poolLen = readingPool.length;
  const base = (packOrder - 1) * 2;

  const passageA: ReadingPassage = readingPool[base % poolLen];
  const passageB: ReadingPassage = readingPool[(base + 1) % poolLen];
  const passageC: ReadingPassage = readingPool[(base + 2) % poolLen];

  const results: Array<{ q: QuestionTemplate; passage: string }> = [];

  for (const q of passageA.questions) results.push({ q, passage: passageA.passage });
  for (const q of passageB.questions) results.push({ q, passage: passageB.passage });
  // Bù 1 câu từ passage C để đủ 15
  results.push({ q: passageC.questions[0], passage: passageC.passage });

  return results.slice(0, READING_QUESTIONS_PER_PACK);
}

/** Prepend passage text to questionText for frontend context rendering. */
function buildReadingQuestionText(passage: string, questionText: string): string {
  return `[Passage]\n${passage}\n\n[Question]\n${questionText}`;
}

// ---------------------------------------------------------------------------
// Main seed logic
// ---------------------------------------------------------------------------

interface SeedSummary {
  packsCreated: number;
  packsUpdated: number;
  questionsInserted: number;
}

async function seedPacks(subjectId: Types.ObjectId, topicMap: Map<string, Types.ObjectId>): Promise<SeedSummary> {
  const summary: SeedSummary = { packsCreated: 0, packsUpdated: 0, questionsInserted: 0 };

  const readingTopicId = topicMap.get(READING_TOPIC_NAME);
  if (!readingTopicId) throw new Error(`Topic not found: ${READING_TOPIC_NAME}`);

  for (let order = 1; order <= 10; order++) {
    // --- Upsert TestPack ---
    const packData = {
      name: `Đề ${order}`,
      totalQuestions: 40,
      description: `Đề luyện Tiếng Anh THPT số ${order} — 40 câu trắc nghiệm 6 phần.`,
    };

    let testPack = await TestPack.findOne({ subjectId, order });
    if (testPack) {
      testPack.name = packData.name;
      testPack.totalQuestions = packData.totalQuestions;
      testPack.description = packData.description;
      await testPack.save();
      summary.packsUpdated += 1;
    } else {
      testPack = await TestPack.create({ subjectId, order, ...packData });
      summary.packsCreated += 1;
    }

    // --- Wipe old questions for this pack ---
    await Question.deleteMany({ packId: testPack._id });

    // --- Build question docs ---
    const docs: object[] = [];

    // Non-reading parts
    for (const part of PART_PLAN) {
      const topicId = topicMap.get(part.topicName);
      if (!topicId) throw new Error(`Topic not found: ${part.topicName}`);

      const templates = pick(part.pool, order, part.count);
      for (const tpl of templates) {
        docs.push({
          topicIds: [topicId],
          packId: testPack._id,
          difficulty: part.difficulty,
          type: 'multiple_choice',
          content: {
            questionText: tpl.questionText,
            options: tpl.options,
            correctAnswer: tpl.correctAnswer,
            explanation: tpl.explanation,
          },
          metadata: {
            generatedBy: 'seed',
            generationPrompt: `pool:english-thpt:${part.topicName}`,
            verified: true,
          },
          usageCount: 0,
        });
      }
    }

    // Reading part
    const readingItems = pickReadingQuestions(order);
    for (const { q, passage } of readingItems) {
      docs.push({
        topicIds: [readingTopicId],
        packId: testPack._id,
        difficulty: READING_DIFFICULTY,
        type: 'multiple_choice',
        content: {
          questionText: buildReadingQuestionText(passage, q.questionText),
          options: q.options,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation,
        },
        metadata: {
          generatedBy: 'seed',
          generationPrompt: `pool:english-thpt:${READING_TOPIC_NAME}`,
          verified: true,
        },
        usageCount: 0,
      });
    }

    await Question.insertMany(docs); // fail-fast: no ordered:false — keep default
    summary.questionsInserted += docs.length;

    console.log(`  pack ${order}: ${docs.length} questions inserted (pack id: ${testPack._id})`);
  }

  return summary;
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri || mongoUri === 'mock') {
    console.error('❌ MONGODB_URI is not set (or is "mock"). Seed needs a real DB.');
    process.exit(1);
  }

  if (process.env.NODE_ENV === 'production' && process.env.ALLOW_PROD_SEED !== '1') {
    console.error('❌ Refusing to seed production. Set ALLOW_PROD_SEED=1 to override.');
    process.exit(1);
  }

  console.log('🌱 Seeding English THPT packs...');
  console.log(`   Connecting to ${mongoUri.replace(/:[^:@/]+@/, ':***@')}`);

  await mongoose.connect(mongoUri);

  try {
    // Load subject
    const subject = await Subject.findOne({ code: 'english-thpt' });
    if (!subject) {
      console.error('❌ Subject "english-thpt" not found. Run `npm run seed:subjects` first.');
      process.exit(1);
    }

    // Build topic name → _id map
    const topicMap = new Map<string, Types.ObjectId>();
    for (const t of subject.topics) {
      topicMap.set(t.name, t._id as Types.ObjectId);
    }

    const requiredTopics = [
      'Ngữ âm', 'Ngữ pháp', 'Từ vựng', 'Đọc hiểu', 'Tìm lỗi sai', 'Viết lại câu',
    ];
    const missing = requiredTopics.filter((name) => !topicMap.has(name));
    if (missing.length > 0) {
      console.error(`❌ Missing topics in subject: ${missing.join(', ')}. Re-run seed:subjects.`);
      process.exit(1);
    }

    const summary = await seedPacks(subject._id as Types.ObjectId, topicMap);

    console.log('\n✅ Done.');
    console.log(`   packs created : ${summary.packsCreated}`);
    console.log(`   packs updated : ${summary.packsUpdated}`);
    console.log(`   questions     : ${summary.questionsInserted}`);
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((err) => {
  console.error('❌ Seed failed:', err);
  mongoose.disconnect().finally(() => process.exit(1));
});
