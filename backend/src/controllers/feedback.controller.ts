import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import mongoose from 'mongoose';
import { ContentFeedback } from '../models/content-feedback.model';

const submitSchema = z.object({
  targetType: z.enum(['question', 'learning_path']),
  targetId: z.string().min(1),
  rating: z.enum(['up', 'down']),
  reason: z.string().max(500).optional(),
});

// Gửi/cập nhật phản hồi chất lượng cho 1 nội dung Gemini (upsert theo user+target).
export const submitFeedback = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user!.userId;
    const parsed = submitSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: parsed.error.errors,
      });
    }
    const { targetType, targetId, rating, reason } = parsed.data;
    if (!mongoose.Types.ObjectId.isValid(targetId)) {
      return res.status(400).json({ success: false, message: 'Invalid targetId' });
    }

    const feedback = await ContentFeedback.findOneAndUpdate(
      {
        userId: new mongoose.Types.ObjectId(userId),
        targetType,
        targetId: new mongoose.Types.ObjectId(targetId),
      },
      { rating, reason: reason ?? null },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );

    res.status(201).json({ success: true, data: { feedback } });
  } catch (error) {
    next(error);
  }
};

// Phản hồi của chính user cho 1 nội dung (để UI hiện trạng thái đã chọn).
export const getMyFeedback = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user!.userId;
    const { targetType, targetId } = req.query as {
      targetType?: string;
      targetId?: string;
    };
    if (!targetId || !mongoose.Types.ObjectId.isValid(targetId)) {
      return res.status(400).json({ success: false, message: 'Invalid targetId' });
    }
    const feedback = await ContentFeedback.findOne({
      userId: new mongoose.Types.ObjectId(userId),
      targetType,
      targetId: new mongoose.Types.ObjectId(targetId),
    }).lean();
    res.json({ success: true, data: { feedback: feedback ?? null } });
  } catch (error) {
    next(error);
  }
};
