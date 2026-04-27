import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import mongoose from 'mongoose';
import { User } from '../models/user.model';
import { Subject } from '../models/subject.model';

const updateProfileSchema = z.object({
  profile: z
    .object({
      name: z.string().min(2).optional(),
      avatarUrl: z.string().url().nullable().optional(),
      grade: z.string().nullable().optional(),
    })
    .strict(),
});

const goalSchema = z.object({
  subjectId: z.string().min(1),
  targetLevel: z.enum(['basic', 'intermediate', 'advanced']),
  targetDate: z.string().min(1),
});

const replaceGoalsSchema = z.object({
  goals: z.array(goalSchema).max(10),
});

const setCurrentLevelSchema = z.object({
  subjectId: z.string().min(1),
  level: z.string().min(1),
});

// Strip passwordHash before responding so it never leaks via this controller.
const stripUser = (user: any) => {
  const obj = typeof user.toObject === 'function' ? user.toObject() : { ...user };
  delete obj.passwordHash;
  return obj;
};

export const updateProfile = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user!.userId;
    const parsed = updateProfileSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: parsed.error.errors,
      });
    }

    // Build dotted-path $set so we never overwrite untouched profile fields.
    const update: Record<string, any> = {};
    for (const [key, value] of Object.entries(parsed.data.profile)) {
      if (value !== undefined) update[`profile.${key}`] = value;
    }

    if (Object.keys(update).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No profile fields supplied',
      });
    }

    const user = await User.findByIdAndUpdate(userId, { $set: update }, { new: true });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    res.json({ success: true, data: { user: stripUser(user) } });
  } catch (error) {
    next(error);
  }
};

export const replaceLearningGoals = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user!.userId;
    const parsed = replaceGoalsSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: parsed.error.errors,
      });
    }

    const { goals } = parsed.data;

    // Reject duplicates (one goal per subject).
    const seen = new Set<string>();
    for (const g of goals) {
      if (seen.has(g.subjectId)) {
        return res.status(400).json({
          success: false,
          message: `Duplicate subjectId in goals: ${g.subjectId}`,
        });
      }
      seen.add(g.subjectId);
      if (!mongoose.Types.ObjectId.isValid(g.subjectId)) {
        return res.status(400).json({
          success: false,
          message: `Invalid subjectId: ${g.subjectId}`,
        });
      }
    }

    // Verify every subjectId exists in catalog.
    const subjectIds = goals.map((g) => new mongoose.Types.ObjectId(g.subjectId));
    const found = await Subject.countDocuments({ _id: { $in: subjectIds } });
    if (found !== subjectIds.length) {
      return res.status(400).json({
        success: false,
        message: 'One or more subjectIds do not exist',
      });
    }

    const normalizedGoals = goals.map((g) => ({
      subjectId: new mongoose.Types.ObjectId(g.subjectId),
      targetLevel: g.targetLevel,
      targetDate: new Date(g.targetDate),
    }));

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: { learningGoals: normalizedGoals } },
      { new: true },
    );
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    res.json({ success: true, data: { user: stripUser(user) } });
  } catch (error) {
    next(error);
  }
};

export const addLearningGoal = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user!.userId;
    const parsed = goalSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: parsed.error.errors,
      });
    }

    const { subjectId, targetLevel, targetDate } = parsed.data;
    if (!mongoose.Types.ObjectId.isValid(subjectId)) {
      return res.status(400).json({ success: false, message: 'Invalid subjectId' });
    }

    const subject = await Subject.findById(subjectId).select('_id');
    if (!subject) {
      return res.status(400).json({ success: false, message: 'Subject not found' });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const exists = user.learningGoals.some(
      (g: any) => g.subjectId.toString() === subjectId,
    );
    if (exists) {
      return res.status(409).json({
        success: false,
        message: 'Goal for this subject already exists',
      });
    }

    user.learningGoals.push({
      subjectId: new mongoose.Types.ObjectId(subjectId),
      targetLevel,
      targetDate: new Date(targetDate),
    });
    await user.save();

    res.status(201).json({ success: true, data: { user: stripUser(user) } });
  } catch (error) {
    next(error);
  }
};

export const removeLearningGoal = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user!.userId;
    const { subjectId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(subjectId)) {
      return res.status(400).json({ success: false, message: 'Invalid subjectId' });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { $pull: { learningGoals: { subjectId: new mongoose.Types.ObjectId(subjectId) } } },
      { new: true },
    );
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    res.json({ success: true, data: { user: stripUser(user) } });
  } catch (error) {
    next(error);
  }
};

export const setCurrentLevel = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user!.userId;
    const parsed = setCurrentLevelSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: parsed.error.errors,
      });
    }

    const { subjectId, level } = parsed.data;
    if (!mongoose.Types.ObjectId.isValid(subjectId)) {
      return res.status(400).json({ success: false, message: 'Invalid subjectId' });
    }

    const subject = await Subject.findById(subjectId).select('_id');
    if (!subject) {
      return res.status(400).json({ success: false, message: 'Subject not found' });
    }

    // Only update subjectId + level; weakTopics intentionally untouched —
    // it's auto-managed by the practice flow and not user-editable.
    const user = await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          'currentLevel.subjectId': new mongoose.Types.ObjectId(subjectId),
          'currentLevel.level': level,
        },
      },
      { new: true },
    );
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    res.json({ success: true, data: { user: stripUser(user) } });
  } catch (error) {
    next(error);
  }
};
