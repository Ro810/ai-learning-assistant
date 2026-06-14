import { Router } from 'express';
import { explainQuestion } from '../controllers/ai.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware);

// Hỏi AI giải thích thêm về 1 câu hỏi (chat nhiều lượt).
router.post('/explain-question', explainQuestion);

export default router;
