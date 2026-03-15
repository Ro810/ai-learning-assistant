import { Request, Response, NextFunction } from 'express';
import { learningPathGenerator } from '../services/learning-path-generator.service';
import { LearningPath } from '../models/learning-path.model';
import mongoose from 'mongoose';

export const createLearningPath = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = (req as any).user?.userId;
    const { subjectId, assessmentId, targetDate, targetLevel, weeklyStudyHours } = req.body;

    if (!subjectId || !assessmentId || !targetDate || !targetLevel) {
      return res.status(400).json({
        success: false,
        message: 'subjectId, assessmentId, targetDate, and targetLevel are required',
      });
    }

    const learningPath = await learningPathGenerator.generate({
      subjectId,
      assessmentId,
      targetDate,
      targetLevel,
      weeklyStudyHours: weeklyStudyHours || 10,
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
    const { milestoneId, action, completionRate } = req.body;

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
