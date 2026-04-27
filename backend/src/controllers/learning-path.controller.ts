import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { learningPathGenerator } from '../services/learning-path-generator.service';
import { LearningPath } from '../models/learning-path.model';
import mongoose from 'mongoose';

const createLearningPathSchema = z.object({
  subjectId: z.string().min(1),
  assessmentId: z.string().min(1),
  targetDate: z.string().min(1, 'targetDate is required'),
  targetLevel: z.enum(['basic', 'intermediate', 'advanced']),
  weeklyStudyHours: z.number().int().min(1).max(168).optional(),
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

    const { subjectId, assessmentId, targetDate, targetLevel, weeklyStudyHours } = parsed.data;

    const learningPath = await learningPathGenerator.generate({
      subjectId,
      assessmentId,
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

    const learningPaths = await LearningPath.find(filter)
      .populate('subjectId', 'name code')
      .sort({ createdAt: -1 });

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
    }).populate('subjectId', 'name code');

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
