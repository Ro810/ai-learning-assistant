// Seed 10 đề Toán THPT × 50 câu MCQ qua AI (Gemini).
// Usage: npm run seed:math-thpt-packs
//
// Prerequisites:
//   - MONGODB_URI + GEMINI_API_KEY trong .env
//   - Subject 'math-thpt' đã có 10 topics (chạy seed:subjects trước)
//
// Behaviour:
//   - 10 pack × (10 chương × 5 câu) = 500 Question.
//   - Idempotent: mỗi pack delete questions cũ rồi gọi AI sinh lại.
//   - Tốn ~5-8 phút và ~100 lượt gọi Gemini.
//   - Lỗi 1 chương → log + skip chương đó, tiếp tục các chương khác.

import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { Subject } from '../models/subject.model';
import { TestPack } from '../models/test-pack.model';
import { Question } from '../models/question.model';
import { questionGenerator } from '../services/question-generator.service';

const SUBJECT_CODE = 'math-thpt';
const TOTAL_PACKS = 10;
const QUESTIONS_PER_TOPIC = 5; // 10 chương × 5 = 50 câu / pack
const DURATION_MINUTES = 90;
const DEFAULT_DIFFICULTY: 1 | 2 | 3 = 2;

interface SeedSummary {
  packsCreated: number;
  packsUpdated: number;
  questionsGenerated: number;
  topicsFailed: number;
}

async function seedMathPacks(): Promise<SeedSummary> {
  const summary: SeedSummary = {
    packsCreated: 0,
    packsUpdated: 0,
    questionsGenerated: 0,
    topicsFailed: 0,
  };

  const subject = await Subject.findOne({ code: SUBJECT_CODE });
  if (!subject) {
    throw new Error(
      `Subject '${SUBJECT_CODE}' not found. Run 'npm run seed:subjects' trước.`
    );
  }
  if (subject.topics.length === 0) {
    throw new Error(`Subject '${SUBJECT_CODE}' không có topic nào.`);
  }

  console.log(
    `📚 Subject: ${subject.name} (${subject.topics.length} chương)\n`
  );

  for (let order = 1; order <= TOTAL_PACKS; order += 1) {
    console.log(`\n📝 Đề ${order}/${TOTAL_PACKS}`);

    let pack = await TestPack.findOne({ subjectId: subject._id, order });
    const totalQuestions = subject.topics.length * QUESTIONS_PER_TOPIC;

    if (!pack) {
      pack = await TestPack.create({
        subjectId: subject._id,
        order,
        name: `Đề ${order}`,
        description: `Đề luyện thi tốt nghiệp THPT môn Toán số ${order} — ${totalQuestions} câu trắc nghiệm.`,
        totalQuestions,
        durationMinutes: DURATION_MINUTES,
      });
      summary.packsCreated += 1;
      console.log(`   + created pack ${pack._id}`);
    } else {
      pack.name = `Đề ${order}`;
      pack.totalQuestions = totalQuestions;
      pack.durationMinutes = DURATION_MINUTES;
      pack.description = `Đề luyện thi tốt nghiệp THPT môn Toán số ${order} — ${totalQuestions} câu trắc nghiệm.`;
      await pack.save();
      summary.packsUpdated += 1;
      console.log(`   ~ updated pack ${pack._id}`);
    }

    // Wipe câu cũ rồi sinh lại — đảm bảo idempotent.
    const deleted = await Question.deleteMany({ packId: pack._id });
    if (deleted.deletedCount) {
      console.log(`   - wiped ${deleted.deletedCount} câu cũ`);
    }

    // Mỗi chương sinh 5 câu qua AI, save kèm packId.
    for (const topic of subject.topics) {
      try {
        const generated = await questionGenerator.generate({
          subjectId: subject._id.toString(),
          topicIds: [topic._id.toString()],
          difficulty: DEFAULT_DIFFICULTY,
          count: QUESTIONS_PER_TOPIC,
          questionType: 'multiple_choice',
          language: 'vi',
          packId: pack._id.toString(),
        });
        summary.questionsGenerated += generated.length;
        console.log(`   ✓ ${topic.name}: +${generated.length} câu`);
      } catch (err: any) {
        summary.topicsFailed += 1;
        console.error(`   ✗ ${topic.name} FAILED: ${err?.message}`);
      }
    }
  }

  return summary;
}

async function main(): Promise<void> {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri || mongoUri === 'mock') {
    console.error('❌ MONGODB_URI is not set (or is "mock"). Seed needs a real DB.');
    process.exit(1);
  }
  if (!process.env.GEMINI_API_KEY) {
    console.error('❌ GEMINI_API_KEY is not set. Math seed gọi Gemini sinh nội dung.');
    process.exit(1);
  }
  if (process.env.NODE_ENV === 'production' && process.env.ALLOW_PROD_SEED !== '1') {
    console.error('❌ Refusing to seed production. Set ALLOW_PROD_SEED=1 to override.');
    process.exit(1);
  }

  console.log('🌱 Seeding Math THPT packs (AI-generated)...');
  console.log(`   Connecting to ${mongoUri.replace(/:[^:@/]+@/, ':***@')}`);
  console.log(
    `   Plan: ${TOTAL_PACKS} packs × ${10 * QUESTIONS_PER_TOPIC} câu (mất ~5-8 phút)\n`
  );

  await mongoose.connect(mongoUri);

  try {
    const summary = await seedMathPacks();
    console.log('\n✅ Done.');
    console.log(`   packs created: ${summary.packsCreated}`);
    console.log(`   packs updated: ${summary.packsUpdated}`);
    console.log(`   questions generated: ${summary.questionsGenerated}`);
    if (summary.topicsFailed > 0) {
      console.log(`   ⚠ topics failed: ${summary.topicsFailed}`);
    }
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((err) => {
  console.error('❌ Seed failed:', err);
  mongoose.disconnect().finally(() => process.exit(1));
});
