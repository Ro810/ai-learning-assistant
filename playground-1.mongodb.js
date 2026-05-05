// MongoDB Playground — xem dữ liệu sau khi làm bài đánh giá
// Bấm ▶ Play (hoặc Ctrl+Alt+R) ở góc trên phải để chạy từng query

use('ai-learning');

// ===== 1. User của bạn =====
// Xem tài khoản đã đăng ký (ẩn passwordHash cho dễ đọc)
db.users.find({}, { passwordHash: 0 }).toArray();

// ===== 2. Bài đánh giá đã làm =====
// Liệt kê tất cả assessment, mới nhất trước
db.assessments
  .find(
    {},
    {
      // Ẩn snapshot dài, chỉ xem metadata
      'questions.questionSnapshot.content': 0,
      'questions.questionSnapshot.metadata': 0,
    },
  )
  .sort({ createdAt: -1 })
  .toArray();

// ===== 3. Chi tiết kết quả một bài (status: completed) =====
// Lấy bài completed mới nhất, hiện điểm + phân tích topic
db.assessments.findOne(
  { status: 'completed' },
  {
    status: 1,
    'results.score': 1,
    'results.correctCount': 1,
    'results.totalQuestions': 1,
    'results.recommendedLevel': 1,
    'results.skillAnalysis': 1,
    completedAt: 1,
  },
);

// ===== 4. Câu hỏi AI sinh (cache reuse) =====
// Xem câu hỏi đã sinh, sắp theo độ khó
db.questions
  .find(
    {},
    {
      'content.questionText': 1,
      'content.correctAnswer': 1,
      difficulty: 1,
      'metadata.generatedBy': 1,
      usageCount: 1,
      createdAt: 1,
    },
  )
  .sort({ createdAt: -1 })
  .limit(10)
  .toArray();

// ===== 5. Thống kê nhanh =====
db.users.countDocuments();
db.assessments.countDocuments({ status: 'completed' });
db.assessments.countDocuments({ status: 'in_progress' });
db.questions.countDocuments();

// Đếm câu hỏi theo provider AI
db.questions
  .aggregate([
    { $group: { _id: '$metadata.generatedBy', count: { $sum: 1 } } },
  ])
  .toArray();

// ===== 6. Câu trả lời sai trong assessment gần nhất =====
// Hữu ích để xem user yếu chỗ nào
db.assessments.aggregate([
  { $match: { status: 'completed' } },
  { $sort: { completedAt: -1 } },
  { $limit: 1 },
  { $unwind: '$questions' },
  { $match: { 'questions.isCorrect': false } },
  {
    $project: {
      _id: 0,
      questionText: '$questions.questionSnapshot.content.questionText',
      correctAnswer: '$questions.questionSnapshot.content.correctAnswer',
      yourAnswer: '$questions.userAnswer',
      explanation: '$questions.questionSnapshot.content.explanation',
    },
  },
]).toArray();
