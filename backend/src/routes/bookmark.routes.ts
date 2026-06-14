import { Router } from 'express';
import {
  toggleBookmark,
  listBookmarks,
  listBookmarkIds,
} from '../controllers/bookmark.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();
router.use(authMiddleware);

// Danh sách câu đã bookmark kèm nội dung.
router.get('/', listBookmarks);
// Chỉ mảng id (để UI tô sao).
router.get('/ids', listBookmarkIds);
// Bật/tắt bookmark 1 câu.
router.post('/toggle', toggleBookmark);

export default router;
