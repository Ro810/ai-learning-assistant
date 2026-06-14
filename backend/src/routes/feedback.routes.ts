import { Router } from 'express';
import { submitFeedback, getMyFeedback } from '../controllers/feedback.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware);

// Gửi/cập nhật phản hồi chất lượng nội dung Gemini (câu hỏi / lộ trình).
router.post('/', submitFeedback);
// Lấy phản hồi của chính user cho 1 nội dung (?targetType=&targetId=).
router.get('/me', getMyFeedback);

export default router;
