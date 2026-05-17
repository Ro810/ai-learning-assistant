import { IAIProvider } from '../types/ai.types';

// Deterministic mock provider for local development when Gemini quota is
// exhausted or unavailable. Returns a hand-crafted JSON array of 10
// multiple-choice questions or a stub learning path / explanation,
// branching on cheap text heuristics in the prompt.
//
// Enabled by setting USE_MOCK_AI=1 in .env. Output formats mirror what
// real Gemini responses look like (markdown code fence + JSON inside)
// so the existing parsers exercise the same code paths.

const QUESTIONS_FIXTURE = Array.from({ length: 10 }, (_, i) => ({
  questionText: `[MOCK] Câu hỏi mẫu số ${i + 1}: 2 + ${i} = ?`,
  options: [
    { id: 'A', text: String(i + 1), isCorrect: false },
    { id: 'B', text: String(i + 2), isCorrect: true },
    { id: 'C', text: String(i + 3), isCorrect: false },
    { id: 'D', text: String(i + 4), isCorrect: false },
  ],
  correctAnswer: 'B',
  explanation: `Đây là câu trả lời mẫu cho câu ${i + 1}. (Mock AI — bật USE_MOCK_AI=1 trong .env)`,
}));

const LEARNING_PATH_FIXTURE = {
  milestones: [
    {
      week: 1,
      topicIds: [],
      difficulty: 1,
      estimatedDays: 7,
      resources: ['Bài giảng mẫu tuần 1', 'Video YouTube ví dụ'],
      title: '[MOCK] Tuần 1 — Khởi đầu cơ bản',
    },
    {
      week: 2,
      topicIds: [],
      difficulty: 2,
      estimatedDays: 7,
      resources: ['Bài giảng mẫu tuần 2'],
      title: '[MOCK] Tuần 2 — Củng cố nền tảng',
    },
    {
      week: 3,
      topicIds: [],
      difficulty: 3,
      estimatedDays: 7,
      resources: ['Bài giảng nâng cao mẫu'],
      title: '[MOCK] Tuần 3 — Thử thách nâng cao',
    },
  ],
};

export class MockAIService implements IAIProvider {
  async generateContent(prompt: string): Promise<string> {
    const lower = prompt.toLowerCase();

    if (lower.includes('milestone') || lower.includes('lộ trình')) {
      return '```json\n' + JSON.stringify(LEARNING_PATH_FIXTURE, null, 2) + '\n```';
    }

    if (lower.includes('giải thích') && !lower.includes('câu hỏi')) {
      return '[MOCK] Đây là giải thích mẫu do Mock AI sinh ra để phát triển khi không có Gemini quota.';
    }

    // Default: question generation
    return '```json\n' + JSON.stringify(QUESTIONS_FIXTURE, null, 2) + '\n```';
  }
}
