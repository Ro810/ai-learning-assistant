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

interface TopicEntry {
  name: string;
  description?: string;
  summary?: string;
}
interface CatalogEntry {
  name: string;
  code: string;
  description: string;
  topics: TopicEntry[];
}

// Helper to convert plain string[] -> TopicEntry[] for subjects không cần description.
const t = (names: string[]): TopicEntry[] => names.map((name) => ({ name }));

const CATALOG: CatalogEntry[] = [
  {
    name: 'Toán THPT',
    code: 'math-thpt',
    description: 'Chương trình Toán phổ thông trung học, hỗ trợ ôn thi tốt nghiệp và đại học.',
    topics: t(['Đại số', 'Hình học', 'Giải tích', 'Lượng giác', 'Xác suất - Thống kê']),
  },
  {
    name: 'Tiếng Anh THPT',
    code: 'english-thpt',
    description: 'Luyện thi Tiếng Anh THPT theo cấu trúc đề thi.',
    topics: t(['Ngữ âm', 'Ngữ pháp', 'Từ vựng', 'Đọc hiểu', 'Tìm lỗi sai', 'Viết lại câu']),
  },
  {
    name: 'Lập trình Python',
    code: 'python-programming',
    description: 'Học Python từ cơ bản đến nâng cao.',
    topics: [
      {
        name: 'Python Syntax & Variables',
        description: 'Khai báo biến, indent, print/input.',
        summary: [
          'Python không cần khai báo kiểu khi tạo biến — biến tự lấy kiểu khi gán.',
          'Tên biến phân biệt hoa thường, bắt đầu bằng chữ hoặc dấu _.',
          'Khối lệnh được phân biệt bằng thụt lề (indent), chuẩn 4 spaces.',
          'Dùng print() để in ra, input() để nhận từ bàn phím.',
          'Comment 1 dòng dùng #, nhiều dòng dùng """ … """.',
        ].join('\n'),
      },
      {
        name: 'Python Data Types',
        description: 'Number, String, Bool, None.',
        summary: [
          'Kiểu cơ bản: int, float, bool, str, None.',
          'Kiểu collection: list, tuple, set, dict.',
          'Dùng type(x) để kiểm tra kiểu của biến.',
          'Ép kiểu: int("5"), str(10), float("3.14").',
        ].join('\n'),
      },
      {
        name: 'Python Operators',
        description: 'Số học, so sánh, logic.',
        summary: [
          'Số học: + - * / // % ** (// chia lấy phần nguyên, ** lũy thừa).',
          'So sánh: == != < > <= >= trả về True/False.',
          'Logic: and, or, not — short-circuit evaluation.',
          'Gán phức hợp: += -= *= /= //=.',
        ].join('\n'),
      },
      {
        name: 'Python Strings',
        description: 'Slicing, f-string, method.',
        summary: [
          'Tạo chuỗi bằng \'…\' hoặc "…". Chuỗi là immutable.',
          'Truy cập ký tự s[i], cắt chuỗi s[start:stop:step].',
          'F-string: f"Xin chào {name}, bạn {age} tuổi".',
          'Method phổ biến: lower(), upper(), split(), strip(), replace(), find().',
        ].join('\n'),
      },
      {
        name: 'Python If…Else',
        description: 'Rẽ nhánh, match-case.',
        summary: [
          'Cấu trúc: if … elif … else, đừng quên dấu : và indent.',
          'Toán tử ternary: value = a if cond else b.',
          'Python 3.10+ hỗ trợ match / case cho pattern matching.',
          'Điều kiện rỗng/0/None/[] đều được coi là False (truthy/falsy).',
        ].join('\n'),
      },
      {
        name: 'Python Loops',
        description: 'for / while, break, continue.',
        summary: [
          'for x in iterable: duyệt list, tuple, dict, range, string.',
          'while condition: lặp đến khi condition sai.',
          'break thoát vòng lặp; continue bỏ qua iteration hiện tại.',
          'range(start, stop, step) tạo dãy số dùng cho for.',
          'else block sau for/while chạy nếu loop kết thúc bình thường (không break).',
        ].join('\n'),
      },
      {
        name: 'Python Functions',
        description: 'def, return, lambda.',
        summary: [
          'Khai báo: def tên_hàm(tham_số): … return giá_trị.',
          'Tham số mặc định: def greet(name="World").',
          '*args nhận tuple, **kwargs nhận dict (tham số biến đổi).',
          'Lambda — hàm 1 dòng: square = lambda x: x*x.',
          'Hàm là first-class: có thể truyền làm tham số, gán biến.',
        ].join('\n'),
      },
      {
        name: 'Python Lists',
        description: 'Slice, method, comprehension.',
        summary: [
          'Tạo bằng [1, 2, 3]. Mutable — có thể thay đổi sau khi tạo.',
          'Method: append(), extend(), insert(), pop(), remove(), sort(), reverse().',
          'Slice: nums[1:4], nums[::-1] để đảo ngược.',
          'List comprehension: [x*2 for x in nums if x > 0].',
        ].join('\n'),
      },
      {
        name: 'Python Tuples',
        description: 'Bất biến, unpacking.',
        summary: [
          'Tạo: (1, 2, 3) hoặc 1, 2, 3. Immutable — không thay đổi được.',
          'Cho phép unpacking: a, b, c = (1, 2, 3).',
          'Dùng làm key trong dict hoặc element trong set (do immutable).',
          'Method ít: count(), index().',
        ].join('\n'),
      },
      {
        name: 'Python Sets',
        description: 'Tập hợp không trùng lặp.',
        summary: [
          'Tạo: {1, 2, 3} hoặc set([1,2,3]). Element không trùng, không sắp xếp.',
          'Method: add(), remove(), discard(), pop(), clear().',
          'Phép toán: union(|), intersection(&), difference(-), symmetric_difference(^).',
          'in operator để check membership rất nhanh (O(1) trung bình).',
        ].join('\n'),
      },
      {
        name: 'Python Dictionaries',
        description: 'Key/value, comprehension.',
        summary: [
          'Cặp key-value: {"name": "Lan", "age": 20}.',
          'Truy cập: d["name"] (lỗi nếu thiếu) hoặc d.get("name", default).',
          'Method: keys(), values(), items(), update(), pop().',
          'Dict comprehension: {k: v*2 for k, v in d.items()}.',
          'Key phải là kiểu immutable (str, int, tuple).',
        ].join('\n'),
      },
      {
        name: 'Python Classes/Objects',
        description: 'class, __init__, self.',
        summary: [
          'Khai báo: class MyClass: với pascal-case naming.',
          'Constructor: def __init__(self, …) chạy khi tạo instance.',
          'self là tham chiếu đến instance hiện tại, luôn là tham số đầu của method.',
          'Attribute gán trong __init__ qua self.attr = value.',
          'Dunder method: __str__, __repr__, __eq__, __len__ cho hành vi đặc biệt.',
        ].join('\n'),
      },
      {
        name: 'Python Inheritance',
        description: 'super(), override.',
        summary: [
          'Cú pháp: class Child(Parent): kế thừa từ Parent.',
          'super().__init__(args) gọi constructor cha.',
          'Method override: định nghĩa lại method cùng tên trong class con.',
          'isinstance(obj, Class) check có phải instance không.',
          'Python hỗ trợ multiple inheritance: class C(A, B).',
        ].join('\n'),
      },
      {
        name: 'Python Try…Except',
        description: 'try/except, raise.',
        summary: [
          'Bắt lỗi: try: … except SomeError as e: … có thể nhiều except.',
          'finally: luôn chạy cuối, dù có exception hay không.',
          'else (sau except): chạy nếu try KHÔNG có lỗi.',
          'raise ValueError("message") để chủ động gây lỗi.',
          'Tự định nghĩa: class MyError(Exception): pass.',
        ].join('\n'),
      },
      {
        name: 'Python Modules',
        description: 'import, math, os, json.',
        summary: [
          'Import cả module: import math → math.sqrt(16).',
          'Import 1 phần: from os import path. Hoặc: from math import sqrt as s.',
          'Thư viện chuẩn hay dùng: math, os, sys, datetime, json, random, re, collections.',
          'Cài thư viện bên ngoài qua pip: pip install requests.',
          'Tạo module riêng: tạo file .py rồi import tên file (không có .py).',
        ].join('\n'),
      },
    ],
  },
  {
    name: 'Tiếng Anh giao tiếp',
    code: 'english-communication',
    description: 'Tiếng Anh giao tiếp hằng ngày và môi trường công việc.',
    topics: t(['Greetings & Small Talk', 'Travel', 'Business English', 'Daily Life']),
  },
];

interface SeedSummary {
  created: number;
  updated: number;
  topicsAdded: number;
  topicsRemoved: number;
  deprecated: number;
}

async function seedCatalog(): Promise<SeedSummary> {
  const summary: SeedSummary = {
    created: 0,
    updated: 0,
    topicsAdded: 0,
    topicsRemoved: 0,
    deprecated: 0,
  };

  for (const entry of CATALOG) {
    const existing = await Subject.findOne({ code: entry.code });

    if (!existing) {
      await Subject.create({
        name: entry.name,
        code: entry.code,
        description: entry.description,
        topics: entry.topics,
      });
      summary.created += 1;
      console.log(`  + created  ${entry.code} (${entry.topics.length} topics)`);
      continue;
    }

    // Reconcile topics:
    // 1) Update description trên topic đã có (giữ _id ổn định).
    // 2) Thêm topic mới chưa có trong DB.
    // 3) Xóa topic trong DB nhưng không còn trong CATALOG (cleanup khi rename/refactor).
    const catalogByName = new Map(entry.topics.map((t) => [t.name, t]));
    const existingByName = new Map(existing.topics.map((t) => [t.name, t]));

    let added = 0;
    let removed = 0;

    // Update description/summary trên topic đã có.
    for (const topic of existing.topics) {
      const fromCatalog = catalogByName.get(topic.name);
      if (!fromCatalog) continue;
      if (fromCatalog.description !== undefined) topic.description = fromCatalog.description;
      if (fromCatalog.summary !== undefined) topic.summary = fromCatalog.summary;
    }

    // Add topic mới.
    for (const ct of entry.topics) {
      if (!existingByName.has(ct.name)) {
        existing.topics.push(ct as any);
        added += 1;
      }
    }

    // Remove topic không còn trong CATALOG.
    // Lưu ý: assessment/question cũ có thể tham chiếu _id đã bị xóa — chấp nhận cho MVP.
    const toRemove = existing.topics
      .filter((t) => !catalogByName.has(t.name))
      .map((t) => t._id);
    // Cast vì Mongoose DocumentArray cung cấp `pull()` nhưng ITopic[] không khai báo.
    const topicsArr = existing.topics as unknown as { pull(id: unknown): void };
    for (const id of toRemove) {
      topicsArr.pull(id);
      removed += 1;
    }

    // Refresh metadata fields (name/description) without touching topic _ids.
    existing.name = entry.name;
    existing.description = entry.description;
    // Nếu subject từng bị deprecate giờ quay lại CATALOG → un-deprecate.
    if (existing.deprecated) existing.deprecated = false;

    if (added > 0 || removed > 0 || existing.isModified()) {
      await existing.save();
      summary.updated += 1;
      summary.topicsAdded += added;
      summary.topicsRemoved += removed;
      console.log(
        `  ~ updated  ${entry.code} (+${added} added, -${removed} removed)`
      );
    } else {
      console.log(`  = skipped  ${entry.code} (no changes)`);
    }
  }

  // Soft-deprecate subjects còn trong DB nhưng đã bị remove khỏi CATALOG (vd: ielts cũ).
  // Giữ document để assessment/learning-path cũ vẫn populate được tên môn.
  const catalogCodes = new Set(CATALOG.map((e) => e.code));
  const allSubjects = await Subject.find({}).select('code deprecated');
  for (const s of allSubjects) {
    if (!catalogCodes.has(s.code) && !s.deprecated) {
      s.deprecated = true;
      await s.save();
      summary.deprecated += 1;
      console.log(`  ! deprecated ${s.code} (no longer in CATALOG)`);
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
    console.log(`   topics removed: ${summary.topicsRemoved}`);
    console.log(`   deprecated: ${summary.deprecated}`);
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((err) => {
  console.error('❌ Seed failed:', err);
  mongoose.disconnect().finally(() => process.exit(1));
});
