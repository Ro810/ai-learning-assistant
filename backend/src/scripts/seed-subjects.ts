// Idempotent subject catalog seeder.
// Usage: `npm run seed:subjects`
//
// Behaviour:
// - Connects to MONGODB_URI (loaded from .env via dotenv).
// - For each subject in CATALOG: upsert by `code`.
// - Topics reconciled by `name` so existing topic _id values are preserved
//   across runs (Question/Assessment refs depend on stable topic IDs).
// - Refuses to run against production unless ALLOW_PROD_SEED=1 is set.

import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { Subject } from '../models/subject.model';

interface CatalogEntry {
  name: string;
  code: string;
  description: string;
  topics: string[];
}

const CATALOG: CatalogEntry[] = [
  {
    name: 'Toán THPT',
    code: 'math-thpt',
    description: 'Chương trình Toán phổ thông trung học, hỗ trợ ôn thi tốt nghiệp và đại học.',
    topics: ['Đại số', 'Hình học', 'Giải tích', 'Lượng giác', 'Xác suất - Thống kê'],
  },
  {
    name: 'IELTS',
    code: 'ielts',
    description: 'Luyện thi IELTS Academic và General — đầy đủ 4 kỹ năng.',
    topics: ['Listening', 'Reading', 'Writing Task 1', 'Writing Task 2', 'Speaking'],
  },
  {
    name: 'Lập trình Python',
    code: 'python-programming',
    description: 'Học Python từ cơ bản đến nâng cao, phù hợp người mới lập trình.',
    topics: ['Cú pháp cơ bản', 'Cấu trúc dữ liệu', 'OOP', 'Thư viện chuẩn'],
  },
  {
    name: 'Tiếng Anh giao tiếp',
    code: 'english-communication',
    description: 'Tiếng Anh giao tiếp hằng ngày và môi trường công việc.',
    topics: ['Greetings & Small Talk', 'Travel', 'Business English', 'Daily Life'],
  },
];

interface SeedSummary {
  created: number;
  updated: number;
  topicsAdded: number;
}

async function seedCatalog(): Promise<SeedSummary> {
  const summary: SeedSummary = { created: 0, updated: 0, topicsAdded: 0 };

  for (const entry of CATALOG) {
    const existing = await Subject.findOne({ code: entry.code });

    if (!existing) {
      await Subject.create({
        name: entry.name,
        code: entry.code,
        description: entry.description,
        topics: entry.topics.map((name) => ({ name })),
      });
      summary.created += 1;
      console.log(`  + created  ${entry.code} (${entry.topics.length} topics)`);
      continue;
    }

    // Reconcile topics by name so existing _id values stay stable.
    const existingNames = new Set(existing.topics.map((t) => t.name));
    let added = 0;
    for (const topicName of entry.topics) {
      if (!existingNames.has(topicName)) {
        existing.topics.push({ name: topicName } as any);
        added += 1;
      }
    }

    // Refresh metadata fields (name/description) without touching topic _ids.
    existing.name = entry.name;
    existing.description = entry.description;

    if (added > 0 || existing.isModified()) {
      await existing.save();
      summary.updated += 1;
      summary.topicsAdded += added;
      console.log(`  ~ updated  ${entry.code} (+${added} new topics)`);
    } else {
      console.log(`  = skipped  ${entry.code} (no changes)`);
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

  if (process.env.NODE_ENV === 'production' && process.env.ALLOW_PROD_SEED !== '1') {
    console.error('❌ Refusing to seed production. Set ALLOW_PROD_SEED=1 to override.');
    process.exit(1);
  }

  console.log('🌱 Seeding subject catalog...');
  console.log(`   Connecting to ${mongoUri.replace(/:[^:@/]+@/, ':***@')}`);

  await mongoose.connect(mongoUri);

  try {
    const summary = await seedCatalog();
    console.log('\n✅ Done.');
    console.log(`   created: ${summary.created}`);
    console.log(`   updated: ${summary.updated}`);
    console.log(`   topics added: ${summary.topicsAdded}`);
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((err) => {
  console.error('❌ Seed failed:', err);
  mongoose.disconnect().finally(() => process.exit(1));
});
