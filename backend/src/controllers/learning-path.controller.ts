import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { learningPathGenerator } from '../services/learning-path-generator.service';
import { LearningPath } from '../models/learning-path.model';
import { Assessment } from '../models/assessment.model';
import mongoose from 'mongoose';

// subjectId tùy chọn — tự suy ra từ bài đánh giá đầu tiên.
// Hỗ trợ chọn 1-3 bài đánh giá cùng môn (assessmentIds). Giữ assessmentId
// (single) cho khả năng tương thích ngược nếu có client cũ.
const createLearningPathSchema = z
  .object({
    subjectId: z.string().min(1).optional(),
    assessmentId: z.string().min(1).optional(),
    assessmentIds: z.array(z.string().min(1)).min(1).max(3).optional(),
    targetDate: z.string().min(1, 'targetDate is required'),
    targetLevel: z.enum(['basic', 'intermediate', 'advanced']),
    weeklyStudyHours: z.number().int().min(1).max(168).optional(),
  })
  .refine((d) => d.assessmentId || (d.assessmentIds && d.assessmentIds.length > 0), {
    message: 'assessmentId hoặc assessmentIds phải có ít nhất 1 phần tử',
    path: ['assessmentIds'],
  });

const updateLearningPathSchema = z.object({
  milestoneId: z.string().optional(),
  action: z.enum(['complete', 'update_progress']).optional(),
  completionRate: z.number().min(0).max(100).optional(),
});

export const createLearningPath = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = (req as any).user?.userId;
    const parsed = createLearningPathSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: parsed.error.errors,
      });
    }

    const {
      subjectId: bodySubjectId,
      assessmentId,
      assessmentIds,
      targetDate,
      targetLevel,
      weeklyStudyHours,
    } = parsed.data;

    // Gom danh sách assessmentIds, ưu tiên field mới; loại trùng.
    const rawIds = assessmentIds && assessmentIds.length > 0
      ? assessmentIds
      : assessmentId ? [assessmentId] : [];
    const idList = Array.from(new Set(rawIds));
    if (idList.length < 1 || idList.length > 3) {
      return res.status(400).json({
        success: false,
        message: 'Cần chọn từ 1 đến 3 bài đánh giá.',
      });
    }
    if (idList.some((id) => !mongoose.Types.ObjectId.isValid(id))) {
      return res.status(400).json({ success: false, message: 'assessmentId không hợp lệ' });
    }

    // Lấy tất cả bài đánh giá → kiểm tra quyền sở hữu + cùng môn học.
    const assessments = await Assessment.find({ _id: { $in: idList } })
      .select('subjectId userId')
      .lean();
    if (assessments.length !== idList.length) {
      return res.status(404).json({ success: false, message: 'Có bài đánh giá không tồn tại' });
    }
    if (assessments.some((a) => a.userId.toString() !== userId)) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }
    const subjectSet = new Set(assessments.map((a) => a.subjectId.toString()));
    if (subjectSet.size > 1) {
      return res.status(400).json({
        success: false,
        message: 'Các bài đánh giá phải cùng môn học.',
      });
    }
    const derivedSubjectId = assessments[0].subjectId.toString();
    if (bodySubjectId && bodySubjectId !== derivedSubjectId) {
      return res.status(400).json({
        success: false,
        message: 'subjectId không khớp với bài đánh giá.',
      });
    }
    const subjectId = derivedSubjectId;

    const learningPath = await learningPathGenerator.generate({
      subjectId,
      assessmentIds: idList,
      targetDate,
      targetLevel,
      weeklyStudyHours: weeklyStudyHours ?? 10,
    }, userId);

    res.status(201).json({
      success: true,
      data: { learningPath },
    });
  } catch (error) {
    next(error);
  }
};

export const getLearningPaths = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = (req as any).user?.userId;
    const { subjectId, status } = req.query;

    const filter: any = { userId: new mongoose.Types.ObjectId(userId) };
    if (subjectId) {
      filter.subjectId = new mongoose.Types.ObjectId(subjectId as string);
    }
    if (status) {
      filter.status = status;
    }

    // Không populate subjectId — frontend đã có danh sách subjects và tra cứu theo ID.
    // Populate sẽ biến subjectId thành object và làm vỡ kiểu string ở frontend.
    const learningPaths = await LearningPath.find(filter).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: { learningPaths },
    });
  } catch (error) {
    next(error);
  }
};

export const getLearningPathById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = (req as any).user?.userId;
    const { id } = req.params;

    const learningPath = await LearningPath.findOne({
      _id: id,
      userId: new mongoose.Types.ObjectId(userId),
    });

    if (!learningPath) {
      return res.status(404).json({
        success: false,
        message: 'Learning path not found',
      });
    }

    res.json({
      success: true,
      data: { learningPath },
    });
  } catch (error) {
    next(error);
  }
};

export const updateLearningPath = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = (req as any).user?.userId;
    const { id } = req.params;
    const parsed = updateLearningPathSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: parsed.error.errors,
      });
    }
    const { milestoneId, action, completionRate } = parsed.data;

    const learningPath = await LearningPath.findOne({
      _id: id,
      userId: new mongoose.Types.ObjectId(userId),
    });

    if (!learningPath) {
      return res.status(404).json({
        success: false,
        message: 'Learning path not found',
      });
    }

    if (milestoneId) {
      // Find milestone by iterating (milestone subdocuments have _id in MongoDB)
      for (const milestone of learningPath.milestones) {
        if ((milestone as any)._id && (milestone as any)._id.toString() === milestoneId) {
          if (action === 'complete') {
            milestone.completedAt = new Date();
            milestone.completionRate = 100;
          } else if (action === 'update_progress' && completionRate !== undefined) {
            milestone.completionRate = Math.min(100, Math.max(0, completionRate));
          }
          break;
        }
      }
    }

    // Recalculate progress
    const totalMilestones = learningPath.milestones.length;
    const completedMilestones = learningPath.milestones.filter(
      m => m.completionRate === 100
    ).length;
    learningPath.progressPercent = totalMilestones > 0
      ? Math.round((completedMilestones / totalMilestones) * 100)
      : 0;

    // Update status
    if (learningPath.progressPercent === 100) {
      learningPath.status = 'completed';
    }

    await learningPath.save();

    res.json({
      success: true,
      data: { learningPath },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteLearningPath = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = (req as any).user?.userId;
    const { id } = req.params;

    const learningPath = await LearningPath.findOneAndDelete({
      _id: id,
      userId: new mongoose.Types.ObjectId(userId),
    });

    if (!learningPath) {
      return res.status(404).json({
        success: false,
        message: 'Learning path not found',
      });
    }

    res.json({
      success: true,
      message: 'Learning path deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
