import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import mongoose from 'mongoose';
import { Assessment } from '../models/assessment.model';
import { Subject } from '../models/subject.model';
import { Question } from '../models/question.model';
import { TestPack } from '../models/test-pack.model';
import { questionGenerator } from '../services/question-generator.service';
import {
  gradeAnswers,
  buildSkillAnalysis,
  deriveRecommendedLevel,
} from '../services/assessment-grader.service';

const createAssessmentSchema = z.object({
  subjectId: z.string().min(1),
  topicIds: z.array(z.string()).optional(),
  difficulty: z.union([z.literal(1), z.literal(2), z.literal(3)]).optional(),
  // Tăng max=40 để pack-mode lấy đủ part Đọc hiểu (15 câu) hoặc Ngữ pháp (10 câu).
  questionCount: z.number().int().min(1).max(40).optional(),
  // Nếu có packId, bỏ qua AI và load Question từ DB scoped theo pack.
  packId: z.string().min(1).optional(),
});

const submitAssessmentSchema = z.object({
  answers: z
    .array(
      z.object({
        questionId: z.string().min(1),
        answer: z.string(),
        timeSpentSeconds: z.number().int().min(0).optional(),
      }),
    )
    .min(1, 'answers must contain at least one item'),
});

// Strip correctAnswer + per-option isCorrect from snapshots so an in-progress
// assessment never leaks the answer key in API responses.
const stripAnswerKey = (assessment: any) => {
  if (!assessment) return assessment;
  const obj = typeof assessment.toObject === 'function' ? assessment.toObject() : { ...assessment };
  obj.questions = (obj.questions ?? []).map((q: any) => {
    const snapshot = { ...(q.questionSnapshot ?? {}) };
    if (snapshot.content) {
      const { correctAnswer, ...content } = snapshot.content;
      snapshot.content = {
        ...content,
        options: (content.options ?? []).map((opt: any) => {
          const { isCorrect, ...rest } = opt;
          return rest;
        }),
      };
    }
    return { ...q, questionSnapshot: snapshot };
  });
  return obj;
};

export const createAssessment = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user!.userId;
    const parsed = createAssessmentSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: parsed.error.errors,
      });
    }

    const { subjectId, topicIds, difficulty, questionCount, packId } = parsed.data;

    if (!mongoose.Types.ObjectId.isValid(subjectId)) {
      return res.status(400).json({ success: false, message: 'Invalid subjectId' });
    }
    if (packId && !mongoose.Types.ObjectId.isValid(packId)) {
      return res.status(400).json({ success: false, message: 'Invalid packId' });
    }

    const userObjId = new mongoose.Types.ObjectId(userId);
    const subjectObjId = new mongoose.Types.ObjectId(subjectId);
    const packObjId = packId ? new mongoose.Types.ObjectId(packId) : null;

    // Scope in-progress conflict theo pack khi có packId, fallback subject-wide cho AI flow.
    // Nhờ vậy user có thể đang dở part Đọc hiểu của Đề 1 mà vẫn mở part khác của Đề 2.
    const conflictFilter: Record<string, unknown> = {
      userId: userObjId,
      status: 'in_progress',
    };
    if (packObjId) conflictFilter.packId = packObjId;
    else conflictFilter.subjectId = subjectObjId;

    const existing = await Assessment.findOne(conflictFilter).select('_id');
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'Bạn còn 1 bài đang làm dở, hoàn thành hoặc hủy trước.',
        data: { existingId: existing._id },
      });
    }

    // Default to all subject topics if caller didn't pick a subset.
    let resolvedTopicIds = topicIds;
    if (!resolvedTopicIds || resolvedTopicIds.length === 0) {
      const subject = await Subject.findById(subjectId).select('topics').lean();
      if (!subject) {
        return res.status(404).json({ success: false, message: 'Subject not found' });
      }
      resolvedTopicIds = (subject.topics ?? []).map((t: any) => t._id.toString());
      if (resolvedTopicIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Subject has no topics; cannot generate assessment.',
        });
      }
    }

    let questions: any[];
    if (packObjId) {
      // Pack mode — bỏ qua AI, lấy thẳng questions pre-seed của pack.
      const pack = await TestPack.findOne({ _id: packObjId, subjectId: subjectObjId })
        .select('_id')
        .lean();
      if (!pack) {
        return res.status(404).json({
          success: false,
          message: 'Pack not found for this subject',
        });
      }

      const topicObjIds = resolvedTopicIds.map((t) => new mongoose.Types.ObjectId(t));
      const limit = questionCount ?? 40;
      const found = await Question.find({
        packId: packObjId,
        topicIds: { $in: topicObjIds },
      })
        .limit(limit)
        .lean();

      if (found.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy câu hỏi cho phần thi này.',
        });
      }
      questions = found;
    } else {
      // AI flow nguyên gốc.
      try {
        questions = await questionGenerator.generate({
          subjectId,
          topicIds: resolvedTopicIds,
          difficulty: difficulty ?? 2,
          count: questionCount ?? 10,
          questionType: 'multiple_choice',
        });
      } catch (err: any) {
        return res.status(502).json({
          success: false,
          message: 'AI question generation failed',
          error: err?.message,
        });
      }
    }

    const assessment = await Assessment.create({
      userId: userObjId,
      subjectId: subjectObjId,
      packId: packObjId,
      status: 'in_progress',
      difficulty: difficulty ?? 2,
      questions: questions.map((q: any) => ({
        questionId: q._id,
        questionSnapshot: q.toObject ? q.toObject() : q,
      })),
    });

    res.status(201).json({
      success: true,
      data: { assessment: stripAnswerKey(assessment) },
    });
  } catch (error) {
    next(error);
  }
};

export const submitAssessment = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;
    const parsed = submitAssessmentSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: parsed.error.errors,
      });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid assessment id' });
    }

    const assessment = await Assessment.findOne({
      _id: id,
      userId: new mongoose.Types.ObjectId(userId),
    });
    if (!assessment) {
      return res.status(404).json({ success: false, message: 'Assessment not found' });
    }
    if (assessment.status !== 'in_progress') {
      return res.status(409).json({
        success: false,
        message: `Cannot submit: assessment is ${assessment.status}.`,
      });
    }

    const graded = gradeAnswers(assessment.questions as any, parsed.data.answers);

    // Apply graded values back onto the embedded questions array.
    assessment.questions.forEach((q: any, idx: number) => {
      const g = graded[idx];
      q.userAnswer = g.userAnswer;
      q.isCorrect = g.isCorrect;
      q.timeSpentSeconds = g.timeSpentSeconds;
    });

    const skillAnalysis = buildSkillAnalysis(graded);
    const recommendedLevel = deriveRecommendedLevel(skillAnalysis);
    const correctCount = graded.filter((g) => g.isCorrect).length;
    const totalQuestions = graded.length;
    const score = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

    assessment.results = {
      score,
      correctCount,
      totalQuestions,
      skillAnalysis,
      recommendedLevel,
    };
    assessment.status = 'completed';
    assessment.completedAt = new Date();
    await assessment.save();

    res.json({ success: true, data: { assessment } });
  } catch (error) {
    next(error);
  }
};

export const abandonAssessment = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid assessment id' });
    }

    const assessment = await Assessment.findOne({
      _id: id,
      userId: new mongoose.Types.ObjectId(userId),
    });
    if (!assessment) {
      return res.status(404).json({ success: false, message: 'Assessment not found' });
    }
    if (assessment.status !== 'in_progress') {
      return res.status(409).json({
        success: false,
        message: 'Cannot abandon: already completed or abandoned.',
      });
    }

    assessment.status = 'abandoned';
    assessment.completedAt = new Date();
    await assessment.save();

    res.json({ success: true, message: 'Assessment abandoned' });
  } catch (error) {
    next(error);
  }
};

export const listAssessments = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user!.userId;
    const { subjectId, status, page = 1, limit = 20 } = req.query;

    const filter: any = { userId: new mongoose.Types.ObjectId(userId) };
    if (subjectId && mongoose.Types.ObjectId.isValid(subjectId as string)) {
      filter.subjectId = new mongoose.Types.ObjectId(subjectId as string);
    }
    if (status) filter.status = status;

    const skip = (Number(page) - 1) * Number(limit);
    const assessments = await Assessment.find(filter)
      .select('-questions')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));
    const total = await Assessment.countDocuments(filter);

    res.json({
      success: true,
      data: {
        assessments,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getAssessmentById = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid assessment id' });
    }

    const assessment = await Assessment.findOne({
      _id: id,
      userId: new mongoose.Types.ObjectId(userId),
    });
    if (!assessment) {
      return res.status(404).json({ success: false, message: 'Assessment not found' });
    }

    // Reveal answer key only after completion. While in progress (or abandoned)
    // the snapshot is sanitized to prevent answer leakage.
    const payload =
      assessment.status === 'completed' ? assessment : stripAnswerKey(assessment);

    res.json({ success: true, data: { assessment: payload } });
  } catch (error) {
    next(error);
  }
};

export const deleteAssessment = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid assessment id' });
    }

    const deleted = await Assessment.findOneAndDelete({
      _id: id,
      userId: new mongoose.Types.ObjectId(userId),
    });
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Assessment not found' });
    }

    res.json({ success: true, message: 'Assessment deleted' });
  } catch (error) {
    next(error);
  }
};
