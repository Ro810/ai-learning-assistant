// Vocabulary pool — 16 câu: fill-blank, synonym, antonym.
// Difficulty được gán ở seed script (difficulty: 1), KHÔNG lưu ở đây.

import { QuestionTemplate } from './index';

export const vocabularyPool: QuestionTemplate[] = [
  // --- Fill in the blank (6 câu) ---
  {
    questionText: 'The scientist made a remarkable ______ that changed our understanding of the universe.',
    options: [
      { id: 'A', text: 'discovery', isCorrect: true },
      { id: 'B', text: 'invention', isCorrect: false },
      { id: 'C', text: 'exploration', isCorrect: false },
      { id: 'D', text: 'experiment', isCorrect: false },
    ],
    correctAnswer: 'A',
    explanation: '"discovery" = khám phá ra điều đã có sẵn; phù hợp ngữ cảnh "changed our understanding".',
  },
  {
    questionText: 'The government introduced new ______ to reduce air pollution in the city.',
    options: [
      { id: 'A', text: 'regulations', isCorrect: true },
      { id: 'B', text: 'constitutions', isCorrect: false },
      { id: 'C', text: 'traditions', isCorrect: false },
      { id: 'D', text: 'celebrations', isCorrect: false },
    ],
    correctAnswer: 'A',
    explanation: '"regulations" = quy định/quy tắc; phù hợp với ngữ cảnh chính sách giảm ô nhiễm.',
  },
  {
    questionText: 'She has a natural ______ for languages and can speak four fluently.',
    options: [
      { id: 'A', text: 'ability', isCorrect: false },
      { id: 'B', text: 'talent', isCorrect: false },
      { id: 'C', text: 'aptitude', isCorrect: true },
      { id: 'D', text: 'skill', isCorrect: false },
    ],
    correctAnswer: 'C',
    explanation: '"aptitude for" = năng khiếu bẩm sinh về; cụm cố định thường dùng với "natural".',
  },
  {
    questionText: 'The students were asked to ______ their essays before submitting them.',
    options: [
      { id: 'A', text: 'revise', isCorrect: true },
      { id: 'B', text: 'review', isCorrect: false },
      { id: 'C', text: 'rewrite', isCorrect: false },
      { id: 'D', text: 'reconsider', isCorrect: false },
    ],
    correctAnswer: 'A',
    explanation: '"revise" = sửa đổi, chỉnh sửa bài viết; đây là cụm cố định trong học thuật.',
  },
  {
    questionText: 'The company decided to ______ its operations to reduce costs.',
    options: [
      { id: 'A', text: 'downsize', isCorrect: true },
      { id: 'B', text: 'minimize', isCorrect: false },
      { id: 'C', text: 'decrease', isCorrect: false },
      { id: 'D', text: 'lessen', isCorrect: false },
    ],
    correctAnswer: 'A',
    explanation: '"downsize" = thu hẹp quy mô (thường dùng cho công ty cắt giảm nhân sự/hoạt động).',
  },
  {
    questionText: 'He was ______ by the beauty of the landscape and stood still for a long time.',
    options: [
      { id: 'A', text: 'amazed', isCorrect: false },
      { id: 'B', text: 'captivated', isCorrect: true },
      { id: 'C', text: 'interested', isCorrect: false },
      { id: 'D', text: 'attracted', isCorrect: false },
    ],
    correctAnswer: 'B',
    explanation: '"captivated by" = bị mê hoặc/cuốn hút hoàn toàn; mạnh hơn "attracted" hay "interested".',
  },
  // --- Synonym (5 câu) ---
  {
    questionText: 'The word closest in meaning to "abundant" is:',
    options: [
      { id: 'A', text: 'scarce', isCorrect: false },
      { id: 'B', text: 'plentiful', isCorrect: true },
      { id: 'C', text: 'limited', isCorrect: false },
      { id: 'D', text: 'moderate', isCorrect: false },
    ],
    correctAnswer: 'B',
    explanation: '"abundant" = dồi dào, phong phú; đồng nghĩa với "plentiful".',
  },
  {
    questionText: 'The word closest in meaning to "obsolete" is:',
    options: [
      { id: 'A', text: 'modern', isCorrect: false },
      { id: 'B', text: 'efficient', isCorrect: false },
      { id: 'C', text: 'outdated', isCorrect: true },
      { id: 'D', text: 'innovative', isCorrect: false },
    ],
    correctAnswer: 'C',
    explanation: '"obsolete" = lỗi thời, không còn dùng nữa; đồng nghĩa với "outdated".',
  },
  {
    questionText: 'The word closest in meaning to "ambiguous" is:',
    options: [
      { id: 'A', text: 'clear', isCorrect: false },
      { id: 'B', text: 'vague', isCorrect: true },
      { id: 'C', text: 'precise', isCorrect: false },
      { id: 'D', text: 'definite', isCorrect: false },
    ],
    correctAnswer: 'B',
    explanation: '"ambiguous" = mơ hồ, có nhiều nghĩa; đồng nghĩa với "vague".',
  },
  {
    questionText: 'The word closest in meaning to "persevere" is:',
    options: [
      { id: 'A', text: 'surrender', isCorrect: false },
      { id: 'B', text: 'hesitate', isCorrect: false },
      { id: 'C', text: 'persist', isCorrect: true },
      { id: 'D', text: 'abandon', isCorrect: false },
    ],
    correctAnswer: 'C',
    explanation: '"persevere" = kiên trì, bền bỉ; đồng nghĩa với "persist".',
  },
  {
    questionText: 'The word closest in meaning to "tranquil" is:',
    options: [
      { id: 'A', text: 'noisy', isCorrect: false },
      { id: 'B', text: 'peaceful', isCorrect: true },
      { id: 'C', text: 'chaotic', isCorrect: false },
      { id: 'D', text: 'turbulent', isCorrect: false },
    ],
    correctAnswer: 'B',
    explanation: '"tranquil" = yên tĩnh, bình lặng; đồng nghĩa với "peaceful".',
  },
  // --- Antonym (5 câu) ---
  {
    questionText: 'The word OPPOSITE in meaning to "diligent" is:',
    options: [
      { id: 'A', text: 'hardworking', isCorrect: false },
      { id: 'B', text: 'careful', isCorrect: false },
      { id: 'C', text: 'lazy', isCorrect: true },
      { id: 'D', text: 'enthusiastic', isCorrect: false },
    ],
    correctAnswer: 'C',
    explanation: '"diligent" = chăm chỉ, cần cù; trái nghĩa là "lazy" (lười biếng).',
  },
  {
    questionText: 'The word OPPOSITE in meaning to "generous" is:',
    options: [
      { id: 'A', text: 'kind', isCorrect: false },
      { id: 'B', text: 'stingy', isCorrect: true },
      { id: 'C', text: 'wealthy', isCorrect: false },
      { id: 'D', text: 'humble', isCorrect: false },
    ],
    correctAnswer: 'B',
    explanation: '"generous" = hào phóng; trái nghĩa là "stingy" (ki kiệt, bủn xỉn).',
  },
  {
    questionText: 'The word OPPOSITE in meaning to "optimistic" is:',
    options: [
      { id: 'A', text: 'realistic', isCorrect: false },
      { id: 'B', text: 'confident', isCorrect: false },
      { id: 'C', text: 'pessimistic', isCorrect: true },
      { id: 'D', text: 'ambitious', isCorrect: false },
    ],
    correctAnswer: 'C',
    explanation: '"optimistic" = lạc quan; trái nghĩa là "pessimistic" (bi quan).',
  },
  {
    questionText: 'The word OPPOSITE in meaning to "temporary" is:',
    options: [
      { id: 'A', text: 'short', isCorrect: false },
      { id: 'B', text: 'brief', isCorrect: false },
      { id: 'C', text: 'permanent', isCorrect: true },
      { id: 'D', text: 'occasional', isCorrect: false },
    ],
    correctAnswer: 'C',
    explanation: '"temporary" = tạm thời; trái nghĩa là "permanent" (lâu dài, vĩnh viễn).',
  },
  {
    questionText: 'The word OPPOSITE in meaning to "flexible" is:',
    options: [
      { id: 'A', text: 'adaptable', isCorrect: false },
      { id: 'B', text: 'rigid', isCorrect: true },
      { id: 'C', text: 'elastic', isCorrect: false },
      { id: 'D', text: 'versatile', isCorrect: false },
    ],
    correctAnswer: 'B',
    explanation: '"flexible" = linh hoạt, dễ thích nghi; trái nghĩa là "rigid" (cứng nhắc).',
  },
];
