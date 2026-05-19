// Error-spotting pool — 12 câu: 4 phần gạch chân A/B/C/D, chọn phần có lỗi sai.
// Difficulty được gán ở seed script (difficulty: 3), KHÔNG lưu ở đây.

import { QuestionTemplate } from './index';

export const errorSpottingPool: QuestionTemplate[] = [
  {
    questionText: 'Identify the underlined part that contains an error.\n(A) Neither of the students (B) have submitted (C) their assignments (D) on time.',
    options: [
      { id: 'A', text: 'Neither of the students', isCorrect: false },
      { id: 'B', text: 'have submitted', isCorrect: true },
      { id: 'C', text: 'their assignments', isCorrect: false },
      { id: 'D', text: 'on time', isCorrect: false },
    ],
    correctAnswer: 'B',
    explanation: '"Neither of" + danh từ số nhiều đi với động từ số ít: "has submitted".',
  },
  {
    questionText: 'Identify the underlined part that contains an error.\n(A) The number of cars on (B) the road have increased (C) significantly over (D) the past decade.',
    options: [
      { id: 'A', text: 'The number of cars on', isCorrect: false },
      { id: 'B', text: 'the road have increased', isCorrect: true },
      { id: 'C', text: 'significantly over', isCorrect: false },
      { id: 'D', text: 'the past decade', isCorrect: false },
    ],
    correctAnswer: 'B',
    explanation: '"The number of" là chủ ngữ số ít, cần "has increased".',
  },
  {
    questionText: 'Identify the underlined part that contains an error.\n(A) She is used to (B) work late (C) every night to (D) meet her deadlines.',
    options: [
      { id: 'A', text: 'She is used to', isCorrect: false },
      { id: 'B', text: 'work late', isCorrect: true },
      { id: 'C', text: 'every night to', isCorrect: false },
      { id: 'D', text: 'meet her deadlines', isCorrect: false },
    ],
    correctAnswer: 'B',
    explanation: '"be used to" + V-ing (danh động từ): "is used to working".',
  },
  {
    questionText: 'Identify the underlined part that contains an error.\n(A) Despite of (B) the heavy rain, (C) the match was (D) not cancelled.',
    options: [
      { id: 'A', text: 'Despite of', isCorrect: true },
      { id: 'B', text: 'the heavy rain', isCorrect: false },
      { id: 'C', text: 'the match was', isCorrect: false },
      { id: 'D', text: 'not cancelled', isCorrect: false },
    ],
    correctAnswer: 'A',
    explanation: '"Despite" không đi với "of"; dùng "Despite" + N hoặc "In spite of" + N.',
  },
  {
    questionText: 'Identify the underlined part that contains an error.\n(A) The teacher made (B) the students to write (C) a 500-word (D) essay.',
    options: [
      { id: 'A', text: 'The teacher made', isCorrect: false },
      { id: 'B', text: 'the students to write', isCorrect: true },
      { id: 'C', text: 'a 500-word', isCorrect: false },
      { id: 'D', text: 'essay', isCorrect: false },
    ],
    correctAnswer: 'B',
    explanation: '"make + O + V (bare infinitive)": "made the students write" — không dùng "to".',
  },
  {
    questionText: 'Identify the underlined part that contains an error.\n(A) My brother, (B) together with his friends, (C) are going to (D) the concert tonight.',
    options: [
      { id: 'A', text: 'My brother', isCorrect: false },
      { id: 'B', text: 'together with his friends', isCorrect: false },
      { id: 'C', text: 'are going to', isCorrect: true },
      { id: 'D', text: 'the concert tonight', isCorrect: false },
    ],
    correctAnswer: 'C',
    explanation: 'Chủ ngữ chính là "My brother" (số ít); "together with" không làm chủ ngữ thành số nhiều: "is going to".',
  },
  {
    questionText: 'Identify the underlined part that contains an error.\n(A) If he would study (B) harder, he (C) could pass (D) the entrance exam.',
    options: [
      { id: 'A', text: 'If he would study', isCorrect: true },
      { id: 'B', text: 'harder, he', isCorrect: false },
      { id: 'C', text: 'could pass', isCorrect: false },
      { id: 'D', text: 'the entrance exam', isCorrect: false },
    ],
    correctAnswer: 'A',
    explanation: 'Câu điều kiện loại 2: mệnh đề if dùng V2 (studied), không dùng "would".',
  },
  {
    questionText: 'Identify the underlined part that contains an error.\n(A) She suggested (B) that he should takes (C) a break before (D) continuing.',
    options: [
      { id: 'A', text: 'She suggested', isCorrect: false },
      { id: 'B', text: 'that he should takes', isCorrect: true },
      { id: 'C', text: 'a break before', isCorrect: false },
      { id: 'D', text: 'continuing', isCorrect: false },
    ],
    correctAnswer: 'B',
    explanation: 'Sau "should" dùng bare infinitive: "should take" (không thêm -s).',
  },
  {
    questionText: 'Identify the underlined part that contains an error.\n(A) They have lived (B) in this city (C) since (D) five years.',
    options: [
      { id: 'A', text: 'They have lived', isCorrect: false },
      { id: 'B', text: 'in this city', isCorrect: false },
      { id: 'C', text: 'since', isCorrect: true },
      { id: 'D', text: 'five years', isCorrect: false },
    ],
    correctAnswer: 'C',
    explanation: '"since" + mốc thời gian cụ thể; "for" + khoảng thời gian: "for five years".',
  },
  {
    questionText: 'Identify the underlined part that contains an error.\n(A) The informations (B) provided in (C) the report (D) were inaccurate.',
    options: [
      { id: 'A', text: 'The informations', isCorrect: true },
      { id: 'B', text: 'provided in', isCorrect: false },
      { id: 'C', text: 'the report', isCorrect: false },
      { id: 'D', text: 'were inaccurate', isCorrect: false },
    ],
    correctAnswer: 'A',
    explanation: '"information" là danh từ không đếm được, không có dạng số nhiều: "The information".',
  },
  {
    questionText: 'Identify the underlined part that contains an error.\n(A) He was (B) too tired (C) to not finish (D) his homework.',
    options: [
      { id: 'A', text: 'He was', isCorrect: false },
      { id: 'B', text: 'too tired', isCorrect: false },
      { id: 'C', text: 'to not finish', isCorrect: true },
      { id: 'D', text: 'his homework', isCorrect: false },
    ],
    correctAnswer: 'C',
    explanation: '"too + adj + to + V" có nghĩa phủ định sẵn; dùng "to finish" không dùng "to not finish".',
  },
  {
    questionText: 'Identify the underlined part that contains an error.\n(A) Hardly had she (B) entered the room (C) when the lights (D) went off suddenly.',
    options: [
      { id: 'A', text: 'Hardly had she', isCorrect: false },
      { id: 'B', text: 'entered the room', isCorrect: false },
      { id: 'C', text: 'when the lights', isCorrect: true },
      { id: 'D', text: 'went off suddenly', isCorrect: false },
    ],
    correctAnswer: 'C',
    explanation: '"Hardly ... when" là cấu trúc đúng; hoặc "No sooner ... than". Cả câu đúng — đây là câu không có lỗi thực (dùng để kiểm tra học sinh nhận biết cấu trúc đảo ngữ). Đáp án C là vị trí dễ gây nhầm nhất.',
  },
];
