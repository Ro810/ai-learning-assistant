// Sentence-rewrite pool — 12 câu: chọn câu có nghĩa gần nhất với câu gốc.
// Difficulty được gán ở seed script (difficulty: 3), KHÔNG lưu ở đây.

import { QuestionTemplate } from './index';

export const sentenceRewritePool: QuestionTemplate[] = [
  {
    questionText: 'Choose the sentence that is closest in meaning to the original.\nOriginal: "It was so dark that we couldn\'t see anything."',
    options: [
      { id: 'A', text: 'It was too dark for us to see anything.', isCorrect: true },
      { id: 'B', text: 'It was dark enough for us to see anything.', isCorrect: false },
      { id: 'C', text: 'It was such dark that we couldn\'t see anything.', isCorrect: false },
      { id: 'D', text: 'It was very dark so that we could see anything.', isCorrect: false },
    ],
    correctAnswer: 'A',
    explanation: '"so + adj + that + can\'t" = "too + adj + for sb + to V" (quá ... đến nỗi không thể).',
  },
  {
    questionText: 'Choose the sentence that is closest in meaning to the original.\nOriginal: "People say that he was born in a small village."',
    options: [
      { id: 'A', text: 'He is said to be born in a small village.', isCorrect: false },
      { id: 'B', text: 'He is said to have been born in a small village.', isCorrect: true },
      { id: 'C', text: 'It is said that he is born in a small village.', isCorrect: false },
      { id: 'D', text: 'He was said to born in a small village.', isCorrect: false },
    ],
    correctAnswer: 'B',
    explanation: 'Mệnh đề con ở quá khứ → dùng "to have been + V3" trong cấu trúc bị động.',
  },
  {
    questionText: 'Choose the sentence that is closest in meaning to the original.\nOriginal: "Although it rained heavily, they continued the outdoor event."',
    options: [
      { id: 'A', text: 'In spite of the heavy rain, they continued the outdoor event.', isCorrect: true },
      { id: 'B', text: 'Despite it rained heavily, they continued the outdoor event.', isCorrect: false },
      { id: 'C', text: 'However it rained heavily, they continued the outdoor event.', isCorrect: false },
      { id: 'D', text: 'Though of the heavy rain, they continued the outdoor event.', isCorrect: false },
    ],
    correctAnswer: 'A',
    explanation: '"Although + clause" = "In spite of / Despite + N/V-ing" (không dùng "despite + clause").',
  },
  {
    questionText: 'Choose the sentence that is closest in meaning to the original.\nOriginal: "The last time I met her was three years ago."',
    options: [
      { id: 'A', text: 'I didn\'t meet her for three years.', isCorrect: false },
      { id: 'B', text: 'I haven\'t met her for three years.', isCorrect: true },
      { id: 'C', text: 'I haven\'t met her since three years.', isCorrect: false },
      { id: 'D', text: 'I last met her three years before.', isCorrect: false },
    ],
    correctAnswer: 'B',
    explanation: 'Lần cuối gặp là 3 năm trước → hiện tại chưa gặp: Present Perfect + "for three years".',
  },
  {
    questionText: 'Choose the sentence that is closest in meaning to the original.\nOriginal: "Tom is too young to drive a car."',
    options: [
      { id: 'A', text: 'Tom is so young that he can drive a car.', isCorrect: false },
      { id: 'B', text: 'Tom is young enough to drive a car.', isCorrect: false },
      { id: 'C', text: 'Tom is so young that he cannot drive a car.', isCorrect: true },
      { id: 'D', text: 'Tom is not old enough that he drives a car.', isCorrect: false },
    ],
    correctAnswer: 'C',
    explanation: '"too + adj + to V" = "so + adj + that + S + can\'t + V".',
  },
  {
    questionText: 'Choose the sentence that is closest in meaning to the original.\nOriginal: "He started working here five years ago."',
    options: [
      { id: 'A', text: 'He has worked here for five years.', isCorrect: true },
      { id: 'B', text: 'He worked here since five years.', isCorrect: false },
      { id: 'C', text: 'He has been working here since five years ago.', isCorrect: false },
      { id: 'D', text: 'He had worked here for five years.', isCorrect: false },
    ],
    correctAnswer: 'A',
    explanation: '"started + time ago" → Present Perfect + "for + khoảng thời gian" (vẫn đang làm).',
  },
  {
    questionText: 'Choose the sentence that is closest in meaning to the original.\nOriginal: "No other student in the class is as tall as Peter."',
    options: [
      { id: 'A', text: 'Peter is the tallest student in the class.', isCorrect: true },
      { id: 'B', text: 'Peter is taller than any other students in the class.', isCorrect: false },
      { id: 'C', text: 'Peter is as tall as the other students in the class.', isCorrect: false },
      { id: 'D', text: 'Peter is tall as no other student in the class.', isCorrect: false },
    ],
    correctAnswer: 'A',
    explanation: '"No other ... as + adj + as X" = "X is the + superlative".',
  },
  {
    questionText: 'Choose the sentence that is closest in meaning to the original.\nOriginal: "You should submit the form immediately."',
    options: [
      { id: 'A', text: 'The form needs to submit immediately.', isCorrect: false },
      { id: 'B', text: 'The form should be submitted immediately.', isCorrect: true },
      { id: 'C', text: 'The form is needed to be submitted immediately.', isCorrect: false },
      { id: 'D', text: 'The form must submitted immediately.', isCorrect: false },
    ],
    correctAnswer: 'B',
    explanation: 'Đổi sang bị động: "should + be + V3" → "The form should be submitted".',
  },
  {
    questionText: 'Choose the sentence that is closest in meaning to the original.\nOriginal: "She regrets not studying harder when she was young."',
    options: [
      { id: 'A', text: 'She wishes she studied harder when she was young.', isCorrect: false },
      { id: 'B', text: 'She wishes she had studied harder when she was young.', isCorrect: true },
      { id: 'C', text: 'She regrets to not study harder when she was young.', isCorrect: false },
      { id: 'D', text: 'She wishes she would have studied harder when she was young.', isCorrect: false },
    ],
    correctAnswer: 'B',
    explanation: 'Hối tiếc về quá khứ: "wish + S + had + V3".',
  },
  {
    questionText: 'Choose the sentence that is closest in meaning to the original.\nOriginal: "It takes me 30 minutes to walk to school."',
    options: [
      { id: 'A', text: 'I spend 30 minutes walking to school.', isCorrect: true },
      { id: 'B', text: 'I spend 30 minutes to walk to school.', isCorrect: false },
      { id: 'C', text: 'I take 30 minutes walking to school.', isCorrect: false },
      { id: 'D', text: 'It spends me 30 minutes to walk to school.', isCorrect: false },
    ],
    correctAnswer: 'A',
    explanation: '"It takes sb + time + to V" = "S + spend + time + V-ing".',
  },
  {
    questionText: 'Choose the sentence that is closest in meaning to the original.\nOriginal: "Unless you leave now, you will miss the train."',
    options: [
      { id: 'A', text: 'If you don\'t leave now, you won\'t miss the train.', isCorrect: false },
      { id: 'B', text: 'If you leave now, you will miss the train.', isCorrect: false },
      { id: 'C', text: 'If you don\'t leave now, you will miss the train.', isCorrect: true },
      { id: 'D', text: 'If you leave now, you won\'t miss the train.', isCorrect: false },
    ],
    correctAnswer: 'C',
    explanation: '"Unless = If ... not": "Unless you leave" = "If you don\'t leave".',
  },
  {
    questionText: 'Choose the sentence that is closest in meaning to the original.\nOriginal: "The project was so complex that no one could complete it alone."',
    options: [
      { id: 'A', text: 'The project was complex enough for anyone to complete alone.', isCorrect: false },
      { id: 'B', text: 'The project was too complex for anyone to complete alone.', isCorrect: true },
      { id: 'C', text: 'The project was such complex that no one could complete it alone.', isCorrect: false },
      { id: 'D', text: 'The project was very complex so no one could complete alone.', isCorrect: false },
    ],
    correctAnswer: 'B',
    explanation: '"so + adj + that + no one + could" = "too + adj + for anyone + to V".',
  },
];
