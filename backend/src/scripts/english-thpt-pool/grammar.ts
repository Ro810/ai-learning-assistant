// Grammar pool — 24 câu: verb tense, conditional, passive, reported speech, modals, articles.
// Difficulty được gán ở seed script (difficulty: 2), KHÔNG lưu ở đây.

import { QuestionTemplate } from './index';

export const grammarPool: QuestionTemplate[] = [
  // --- Verb tenses (6 câu) ---
  {
    questionText: 'By the time she arrived, we ______ dinner.',
    options: [
      { id: 'A', text: 'had already finished', isCorrect: true },
      { id: 'B', text: 'already finished', isCorrect: false },
      { id: 'C', text: 'have already finished', isCorrect: false },
      { id: 'D', text: 'were finishing', isCorrect: false },
    ],
    correctAnswer: 'A',
    explanation: 'Dùng Past Perfect vì hành động "finish dinner" xảy ra trước "arrived" trong quá khứ.',
  },
  {
    questionText: 'She ______ in this company for ten years when she decided to retire.',
    options: [
      { id: 'A', text: 'has worked', isCorrect: false },
      { id: 'B', text: 'had been working', isCorrect: true },
      { id: 'C', text: 'was working', isCorrect: false },
      { id: 'D', text: 'worked', isCorrect: false },
    ],
    correctAnswer: 'B',
    explanation: 'Past Perfect Continuous diễn tả hành động kéo dài liên tục đến một thời điểm trong quá khứ.',
  },
  {
    questionText: 'I ______ to the gym every morning, but now I prefer jogging.',
    options: [
      { id: 'A', text: 'used to go', isCorrect: true },
      { id: 'B', text: 'am used to going', isCorrect: false },
      { id: 'C', text: 'would go', isCorrect: false },
      { id: 'D', text: 'use to go', isCorrect: false },
    ],
    correctAnswer: 'A',
    explanation: '"used to + V" diễn tả thói quen trong quá khứ nay không còn nữa.',
  },
  {
    questionText: 'Look at those dark clouds! It ______ soon.',
    options: [
      { id: 'A', text: 'will rain', isCorrect: false },
      { id: 'B', text: 'is going to rain', isCorrect: true },
      { id: 'C', text: 'rains', isCorrect: false },
      { id: 'D', text: 'is raining', isCorrect: false },
    ],
    correctAnswer: 'B',
    explanation: '"be going to" dùng khi có bằng chứng hiện tại cho thấy sự việc sắp xảy ra.',
  },
  {
    questionText: 'We ______ for two hours by the time the bus finally came.',
    options: [
      { id: 'A', text: 'waited', isCorrect: false },
      { id: 'B', text: 'have been waiting', isCorrect: false },
      { id: 'C', text: 'had been waiting', isCorrect: true },
      { id: 'D', text: 'were waiting', isCorrect: false },
    ],
    correctAnswer: 'C',
    explanation: 'Past Perfect Continuous nhấn mạnh khoảng thời gian kéo dài trước một mốc trong quá khứ.',
  },
  {
    questionText: 'The train ______ at 6 a.m. tomorrow according to the schedule.',
    options: [
      { id: 'A', text: 'leaves', isCorrect: true },
      { id: 'B', text: 'will leave', isCorrect: false },
      { id: 'C', text: 'is going to leave', isCorrect: false },
      { id: 'D', text: 'left', isCorrect: false },
    ],
    correctAnswer: 'A',
    explanation: 'Thì hiện tại đơn dùng cho lịch trình, thời gian biểu cố định trong tương lai.',
  },
  // --- Conditionals (4 câu) ---
  {
    questionText: 'If I ______ harder, I would have passed the exam.',
    options: [
      { id: 'A', text: 'study', isCorrect: false },
      { id: 'B', text: 'studied', isCorrect: false },
      { id: 'C', text: 'had studied', isCorrect: true },
      { id: 'D', text: 'have studied', isCorrect: false },
    ],
    correctAnswer: 'C',
    explanation: 'Câu điều kiện loại 3 (giả định trái với thực tế quá khứ): If + had + V3, would + have + V3.',
  },
  {
    questionText: 'If she ______ the truth, she wouldn\'t be in trouble now.',
    options: [
      { id: 'A', text: 'told', isCorrect: false },
      { id: 'B', text: 'had told', isCorrect: true },
      { id: 'C', text: 'tells', isCorrect: false },
      { id: 'D', text: 'would tell', isCorrect: false },
    ],
    correctAnswer: 'B',
    explanation: 'Câu điều kiện hỗn hợp: mệnh đề if dùng loại 3 (quá khứ giả định), mệnh đề chính dùng loại 2 (hiện tại).',
  },
  {
    questionText: 'Unless you ______ immediately, you will miss the deadline.',
    options: [
      { id: 'A', text: 'start', isCorrect: true },
      { id: 'B', text: 'don\'t start', isCorrect: false },
      { id: 'C', text: 'started', isCorrect: false },
      { id: 'D', text: 'won\'t start', isCorrect: false },
    ],
    correctAnswer: 'A',
    explanation: '"Unless" = "If ... not"; mệnh đề sau unless dùng thì hiện tại đơn (không dùng phủ định thêm).',
  },
  {
    questionText: 'Suppose you ______ a million dollars, what would you do?',
    options: [
      { id: 'A', text: 'win', isCorrect: false },
      { id: 'B', text: 'have won', isCorrect: false },
      { id: 'C', text: 'won', isCorrect: true },
      { id: 'D', text: 'had won', isCorrect: false },
    ],
    correctAnswer: 'C',
    explanation: 'Câu điều kiện loại 2 (giả định không có thật ở hiện tại): Suppose + V2/ed, would + V.',
  },
  // --- Passive voice (4 câu) ---
  {
    questionText: 'The new bridge ______ by the government next year.',
    options: [
      { id: 'A', text: 'is built', isCorrect: false },
      { id: 'B', text: 'will be built', isCorrect: true },
      { id: 'C', text: 'is being built', isCorrect: false },
      { id: 'D', text: 'has been built', isCorrect: false },
    ],
    correctAnswer: 'B',
    explanation: 'Bị động tương lai đơn: will be + V3.',
  },
  {
    questionText: 'She ______ to the party by the time I arrived.',
    options: [
      { id: 'A', text: 'had already been invited', isCorrect: true },
      { id: 'B', text: 'had already invited', isCorrect: false },
      { id: 'C', text: 'was already invited', isCorrect: false },
      { id: 'D', text: 'has already been invited', isCorrect: false },
    ],
    correctAnswer: 'A',
    explanation: 'Bị động Past Perfect: had been + V3.',
  },
  {
    questionText: 'English ______ as an official language in many countries.',
    options: [
      { id: 'A', text: 'speaks', isCorrect: false },
      { id: 'B', text: 'spoke', isCorrect: false },
      { id: 'C', text: 'is spoken', isCorrect: true },
      { id: 'D', text: 'has spoken', isCorrect: false },
    ],
    correctAnswer: 'C',
    explanation: 'Bị động hiện tại đơn: is/am/are + V3.',
  },
  {
    questionText: 'The report ______ by the team for three days.',
    options: [
      { id: 'A', text: 'has been writing', isCorrect: false },
      { id: 'B', text: 'has been written', isCorrect: true },
      { id: 'C', text: 'is being writing', isCorrect: false },
      { id: 'D', text: 'was been written', isCorrect: false },
    ],
    correctAnswer: 'B',
    explanation: 'Bị động Present Perfect: has/have been + V3.',
  },
  // --- Reported speech (3 câu) ---
  {
    questionText: 'He said, "I will call you tomorrow." → He said that he ______ the next day.',
    options: [
      { id: 'A', text: 'will call me', isCorrect: false },
      { id: 'B', text: 'would call me', isCorrect: true },
      { id: 'C', text: 'called me', isCorrect: false },
      { id: 'D', text: 'had called me', isCorrect: false },
    ],
    correctAnswer: 'B',
    explanation: 'Lùi thì trong lời nói gián tiếp: will → would; tomorrow → the next day.',
  },
  {
    questionText: 'She asked me, "Have you finished the assignment?" → She asked me ______.',
    options: [
      { id: 'A', text: 'if I have finished the assignment', isCorrect: false },
      { id: 'B', text: 'whether I had finished the assignment', isCorrect: true },
      { id: 'C', text: 'that I had finished the assignment', isCorrect: false },
      { id: 'D', text: 'if had I finished the assignment', isCorrect: false },
    ],
    correctAnswer: 'B',
    explanation: 'Câu hỏi gián tiếp Yes/No dùng if/whether; present perfect → past perfect.',
  },
  {
    questionText: 'The teacher said, "Don\'t talk in class." → The teacher told us ______.',
    options: [
      { id: 'A', text: 'don\'t talk in class', isCorrect: false },
      { id: 'B', text: 'to not talk in class', isCorrect: false },
      { id: 'C', text: 'not to talk in class', isCorrect: true },
      { id: 'D', text: 'that don\'t talk in class', isCorrect: false },
    ],
    correctAnswer: 'C',
    explanation: 'Mệnh lệnh phủ định trong lời nói gián tiếp: told + O + not to + V.',
  },
  // --- Modals (4 câu) ---
  {
    questionText: 'You ______ see a doctor if you are not feeling well.',
    options: [
      { id: 'A', text: 'must', isCorrect: false },
      { id: 'B', text: 'should', isCorrect: true },
      { id: 'C', text: 'would', isCorrect: false },
      { id: 'D', text: 'might', isCorrect: false },
    ],
    correctAnswer: 'B',
    explanation: '"should" dùng để đưa ra lời khuyên.',
  },
  {
    questionText: 'She ______ have left already — her bag is gone.',
    options: [
      { id: 'A', text: 'should', isCorrect: false },
      { id: 'B', text: 'must', isCorrect: true },
      { id: 'C', text: 'might', isCorrect: false },
      { id: 'D', text: 'can', isCorrect: false },
    ],
    correctAnswer: 'B',
    explanation: '"must have + V3" suy luận logic về việc đã xảy ra trong quá khứ (gần chắc chắn).',
  },
  {
    questionText: 'You ______ enter this area without a security pass.',
    options: [
      { id: 'A', text: 'don\'t have to', isCorrect: false },
      { id: 'B', text: 'mustn\'t', isCorrect: true },
      { id: 'C', text: 'shouldn\'t have to', isCorrect: false },
      { id: 'D', text: 'mightn\'t', isCorrect: false },
    ],
    correctAnswer: 'B',
    explanation: '"mustn\'t" = cấm tuyệt đối; "don\'t have to" chỉ nghĩa không cần thiết.',
  },
  {
    questionText: 'When I was young, I ______ swim very fast.',
    options: [
      { id: 'A', text: 'could', isCorrect: true },
      { id: 'B', text: 'can', isCorrect: false },
      { id: 'C', text: 'was able to', isCorrect: false },
      { id: 'D', text: 'might', isCorrect: false },
    ],
    correctAnswer: 'A',
    explanation: '"could" là quá khứ của "can", dùng để diễn tả khả năng trong quá khứ.',
  },
  // --- Articles (3 câu) ---
  {
    questionText: 'She plays ______ violin beautifully in ______ orchestra.',
    options: [
      { id: 'A', text: 'the / an', isCorrect: false },
      { id: 'B', text: 'a / the', isCorrect: false },
      { id: 'C', text: 'the / the', isCorrect: true },
      { id: 'D', text: 'a / an', isCorrect: false },
    ],
    correctAnswer: 'C',
    explanation: '"play the + nhạc cụ"; "the orchestra" vì đây là danh từ cụ thể đã xác định.',
  },
  {
    questionText: 'He is ______ honest man with ______ good reputation.',
    options: [
      { id: 'A', text: 'a / a', isCorrect: false },
      { id: 'B', text: 'an / a', isCorrect: true },
      { id: 'C', text: 'the / the', isCorrect: false },
      { id: 'D', text: 'an / the', isCorrect: false },
    ],
    correctAnswer: 'B',
    explanation: '"an" trước "honest" vì âm đầu là nguyên âm /ɒ/; "a" trước "good" vì âm đầu là phụ âm.',
  },
  {
    questionText: 'My sister goes to ______ university in ______ United States.',
    options: [
      { id: 'A', text: 'an / the', isCorrect: false },
      { id: 'B', text: 'a / a', isCorrect: false },
      { id: 'C', text: 'a / the', isCorrect: true },
      { id: 'D', text: 'the / the', isCorrect: false },
    ],
    correctAnswer: 'C',
    explanation: '"a university" vì "university" bắt đầu bằng âm /j/ (phụ âm); "the United States" vì tên quốc gia số nhiều cần "the".',
  },
];
