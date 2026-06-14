import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import mongoose from 'mongoose';
import { Bookmark } from '../models/bookmark.model';
import { Question } from '../models/question.model';

const toggleSchema = z.object({ questionId: z.string().min(1) });

// Bật/tắt bookmark cho 1 câu hỏi. Trả { bookmarked } sau thao tác.
export const toggleBookmark = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user!.userId);
    const parsed = toggleSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, message: 'Validation error', errors: parsed.error.errors });
    }
    if (!mongoose.Types.ObjectId.isValid(parsed.data.questionId)) {
      return res.status(400).json({ success: false, message: 'Invalid questionId' });
    }
    const questionId = new mongoose.Types.ObjectId(parsed.data.questionId);

    const existing = await Bookmark.findOne({ userId, questionId }).select('_id');
    if (existing) {
      await Bookmark.deleteOne({ _id: existing._id });
      return res.json({ success: true, data: { bookmarked: false } });
    }
    await Bookmark.create({ userId, questionId });
    res.status(201).json({ success: true, data: { bookmarked: true } });
  } catch (error) {
    next(error);
  }
};

// Danh sách câu đã bookmark kèm nội dung câu hỏi (join Question).
export const listBookmarks = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user!.userId);
    const bookmarks = await Bookmark.find({ userId }).sort({ createdAt: -1 }).lean();
    const qIds = bookmarks.map((b) => b.questionId);
    const questions = await Question.find({ _id: { $in: qIds } })
      .select('content topicIds difficulty')
      .lean();
    const qMap = new Map(questions.map((q: any) => [q._id.toString(), q]));

    // Giữ thứ tự bookmark (mới nhất trước); bỏ câu đã bị xóa.
    const items = bookmarks
      .map((b) => {
        const q = qMap.get(b.questionId.toString());
        if (!q) return null;
        return {
          _id: b._id,
          questionId: b.questionId,
          createdAt: b.createdAt,
          content: q.content,
          topicIds: q.topicIds,
          difficulty: q.difficulty,
        };
      })
      .filter(Boolean);

    res.json({ success: true, data: { items } });
  } catch (error) {
    next(error);
  }
};

// Chỉ trả mảng questionId đã bookmark (để UI tô sao nhanh, nhẹ).
export const listBookmarkIds = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user!.userId);
    const bookmarks = await Bookmark.find({ userId }).select('questionId').lean();
    res.json({ success: true, data: { ids: bookmarks.map((b) => b.questionId) } });
  } catch (error) {
    next(error);
  }
};
