import { Router } from 'express';
import { upsertNote, getNotes } from '../controllers/note.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();
router.use(authMiddleware);

// Lấy ghi chú (?topicId= → 1, không có → tất cả).
router.get('/', getNotes);
// Lưu/cập nhật ghi chú theo chủ đề (content rỗng = xóa).
router.put('/', upsertNote);

export default router;
