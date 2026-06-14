import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import mongoose from 'mongoose';
import { Note } from '../models/note.model';

const upsertSchema = z.object({
  subjectId: z.string().min(1),
  topicId: z.string().min(1),
  content: z.string().max(5000),
});

// Lưu/cập nhật ghi chú theo chủ đề. content rỗng → xóa ghi chú.
export const upsertNote = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const parsed = upsertSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, message: 'Validation error', errors: parsed.error.errors });
    }
    const { subjectId, topicId, content } = parsed.data;
    if (!mongoose.Types.ObjectId.isValid(subjectId) || !mongoose.Types.ObjectId.isValid(topicId)) {
      return res.status(400).json({ success: false, message: 'Invalid id' });
    }
    const filter = {
      userId: new mongoose.Types.ObjectId(userId),
      topicId: new mongoose.Types.ObjectId(topicId),
    };

    if (content.trim().length === 0) {
      await Note.deleteOne(filter);
      return res.json({ success: true, data: { note: null } });
    }

    const note = await Note.findOneAndUpdate(
      filter,
      { content, subjectId: new mongoose.Types.ObjectId(subjectId) },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );
    res.json({ success: true, data: { note } });
  } catch (error) {
    next(error);
  }
};

// Lấy ghi chú: ?topicId= → 1 ghi chú; không có → toàn bộ ghi chú của user.
export const getNotes = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user!.userId);
    const { topicId } = req.query as { topicId?: string };

    if (topicId) {
      if (!mongoose.Types.ObjectId.isValid(topicId)) {
        return res.status(400).json({ success: false, message: 'Invalid topicId' });
      }
      const note = await Note.findOne({ userId, topicId: new mongoose.Types.ObjectId(topicId) }).lean();
      return res.json({ success: true, data: { note: note ?? null } });
    }

    const notes = await Note.find({ userId }).sort({ updatedAt: -1 }).lean();
    res.json({ success: true, data: { notes } });
  } catch (error) {
    next(error);
  }
};
