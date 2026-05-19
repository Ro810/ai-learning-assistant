// Phonetics pool — 12 câu tìm từ có phát âm/trọng âm khác biệt so với các từ còn lại.
// Difficulty được gán ở seed script (difficulty: 1), KHÔNG lưu ở đây.

import { QuestionTemplate } from './index';

export const phoneticsPool: QuestionTemplate[] = [
  // --- Stress (trọng âm) ---
  {
    questionText: 'Chọn từ có trọng âm chính rơi vào âm tiết KHÁC với các từ còn lại.',
    options: [
      { id: 'A', text: 'stu-DENT', isCorrect: false },
      { id: 'B', text: 'BE-gin', isCorrect: false },
      { id: 'C', text: 'COM-fort', isCorrect: true },
      { id: 'D', text: 're-TURN', isCorrect: false },
    ],
    correctAnswer: 'C',
    explanation: 'comfort có trọng âm ở âm tiết đầu; các từ còn lại có trọng âm ở âm tiết 2.',
  },
  {
    questionText: 'Chọn từ có trọng âm chính rơi vào âm tiết KHÁC với các từ còn lại.',
    options: [
      { id: 'A', text: 'de-CIDE', isCorrect: false },
      { id: 'B', text: 'be-LONG', isCorrect: false },
      { id: 'C', text: 'in-VITE', isCorrect: false },
      { id: 'D', text: 'LIS-ten', isCorrect: true },
    ],
    correctAnswer: 'D',
    explanation: 'listen có trọng âm ở âm tiết đầu (LIS-ten); các từ còn lại có trọng âm ở âm tiết 2.',
  },
  {
    questionText: 'Chọn từ có trọng âm chính rơi vào âm tiết KHÁC với các từ còn lại.',
    options: [
      { id: 'A', text: 'PHO-to', isCorrect: false },
      { id: 'B', text: 'WIN-dow', isCorrect: false },
      { id: 'C', text: 'MOR-ning', isCorrect: false },
      { id: 'D', text: 'ma-CHINE', isCorrect: true },
    ],
    correctAnswer: 'D',
    explanation: 'machine có trọng âm ở âm tiết 2 (ma-CHINE); các từ còn lại có trọng âm ở âm tiết đầu.',
  },
  {
    questionText: 'Chọn từ có trọng âm chính rơi vào âm tiết KHÁC với các từ còn lại.',
    options: [
      { id: 'A', text: 'vo-CA-bu-lary', isCorrect: false },
      { id: 'B', text: 'in-FORM-ation', isCorrect: true },
      { id: 'C', text: 'ex-AM-ine', isCorrect: false },
      { id: 'D', text: 'ac-TIV-ity', isCorrect: false },
    ],
    correctAnswer: 'B',
    explanation: 'information có trọng âm ở âm tiết 3 (in-for-MA-tion); các từ còn lại có trọng âm ở âm tiết 2.',
  },
  // --- Pronunciation (phát âm nguyên âm/phụ âm) ---
  {
    questionText: 'Chọn từ có phần gạch chân được phát âm KHÁC với các từ còn lại: ch_e_ese / b_e_d / h_e_re / _e_gg',
    options: [
      { id: 'A', text: 'cheese', isCorrect: false },
      { id: 'B', text: 'bed', isCorrect: true },
      { id: 'C', text: 'here', isCorrect: false },
      { id: 'D', text: 'eve', isCorrect: false },
    ],
    correctAnswer: 'B',
    explanation: 'bed có âm /e/ ngắn; cheese, here, eve đều có âm /iː/ dài.',
  },
  {
    questionText: 'Chọn từ có phần gạch chân được phát âm KHÁC với các từ còn lại: g_o_ / n_o_se / _o_pen / l_o_ve',
    options: [
      { id: 'A', text: 'go', isCorrect: false },
      { id: 'B', text: 'nose', isCorrect: false },
      { id: 'C', text: 'open', isCorrect: false },
      { id: 'D', text: 'love', isCorrect: true },
    ],
    correctAnswer: 'D',
    explanation: 'love có âm /ʌ/; go, nose, open đều có âm /oʊ/.',
  },
  {
    questionText: 'Chọn từ có âm cuối được phát âm KHÁC với các từ còn lại.',
    options: [
      { id: 'A', text: 'worked', isCorrect: false },
      { id: 'B', text: 'stopped', isCorrect: false },
      { id: 'C', text: 'laughed', isCorrect: false },
      { id: 'D', text: 'played', isCorrect: true },
    ],
    correctAnswer: 'D',
    explanation: 'played kết thúc bằng âm /d/; worked, stopped, laughed kết thúc bằng âm /t/.',
  },
  {
    questionText: 'Chọn từ có âm cuối được phát âm KHÁC với các từ còn lại.',
    options: [
      { id: 'A', text: 'wanted', isCorrect: false },
      { id: 'B', text: 'needed', isCorrect: false },
      { id: 'C', text: 'landed', isCorrect: false },
      { id: 'D', text: 'watched', isCorrect: true },
    ],
    correctAnswer: 'D',
    explanation: 'watched kết thúc bằng âm /t/; wanted, needed, landed kết thúc bằng âm /ɪd/.',
  },
  {
    questionText: 'Chọn từ có phần gạch chân được phát âm KHÁC với các từ còn lại: _th_ink / _th_is / _th_ese / _th_ey',
    options: [
      { id: 'A', text: 'think', isCorrect: true },
      { id: 'B', text: 'this', isCorrect: false },
      { id: 'C', text: 'these', isCorrect: false },
      { id: 'D', text: 'they', isCorrect: false },
    ],
    correctAnswer: 'A',
    explanation: 'think có âm /θ/ (vô thanh); this, these, they có âm /ð/ (hữu thanh).',
  },
  {
    questionText: 'Chọn từ có nguyên âm gạch chân được phát âm KHÁC với các từ còn lại: f_a_ther / _a_fter / _a_rm / _a_sk',
    options: [
      { id: 'A', text: 'father', isCorrect: false },
      { id: 'B', text: 'after', isCorrect: true },
      { id: 'C', text: 'arm', isCorrect: false },
      { id: 'D', text: 'fast', isCorrect: false },
    ],
    correctAnswer: 'B',
    explanation: 'after có âm /æ/ trong giọng Mỹ; father, arm, fast thường có âm /ɑː/ trong giọng Anh.',
  },
  {
    questionText: 'Chọn từ có trọng âm chính rơi vào âm tiết KHÁC với các từ còn lại.',
    options: [
      { id: 'A', text: 'un-DER-stand', isCorrect: false },
      { id: 'B', text: 'en-ter-TAIN', isCorrect: false },
      { id: 'C', text: 'rec-om-MEND', isCorrect: false },
      { id: 'D', text: 'COM-pe-tent', isCorrect: true },
    ],
    correctAnswer: 'D',
    explanation: 'competent có trọng âm ở âm tiết đầu; understand, entertain, recommend có trọng âm ở âm tiết cuối.',
  },
  {
    questionText: 'Chọn từ có âm /s/ thay vì âm /z/ ở cuối từ.',
    options: [
      { id: 'A', text: 'dogs', isCorrect: false },
      { id: 'B', text: 'cars', isCorrect: false },
      { id: 'C', text: 'books', isCorrect: true },
      { id: 'D', text: 'pens', isCorrect: false },
    ],
    correctAnswer: 'C',
    explanation: 'books kết thúc bằng /s/ vì âm trước đó (/k/) là phụ âm vô thanh; dogs, cars, pens kết thúc bằng /z/.',
  },
];
