import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import mongoose from 'mongoose';
import { PracticeSession } from '../models/practice-session.model';
import { Question } from '../models/question.model';
import { User } from '../models/user.model';
import { Subject } from '../models/subject.model';
import { selectQuestions } from '../services/practice-question-selector.service';
import {
  applyAdaptive,
  computePracticeResults,
} from '../services/practice-grader.service';

const createSessionSchema = z.object({
  topicIds: z.array(z.string()).min(1),
  mode: z.enum(['adaptive', 'exam_simulation']).optional(),
  subjectId: z.string().optional(),
  settings: z
    .object({
      questionCount: z.number().int().min(1).max(50).optional(),
      difficultyRange: z.tuple([z.number().int().min(1).max(3), z.number().int().min(1).max(3)]).optional(),
      timeLimitMinutes: z.number().int().min(1).max(300).optional(),
    })
    .optional(),
});

const answerSchema = z.object({
  questionId: z.string().min(1),
  answer: z.string(),
  timeSpentSeconds: z.number().int().min(0).optional(),
  hintUsed: z.boolean().optional(),
});

// Build a public-facing question payload — strip correctAnswer + per-option
// isCorrect flags so the client never sees the key while practising.
const toPublicQuestion = (q: any, order: number) => {
  const content = q.content ?? {};
  const { correctAnswer, ...rest } = content;
  return {
    questionId: q._id,
    order,
    content: {
      ...rest,
      options: (rest.options ?? []).map((opt: any) => {
        const { isCorrect, ...optRest } = opt;
        return optRest;
      }),
    },
    difficulty: q.difficulty,
    topicIds: q.topicIds,
  };
};

export const createSession = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user!.userId;
    const parsed = createSessionSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: parsed.error.errors,
      });
    }

    const userObjId = new mongoose.Types.ObjectId(userId);

    // Global single-in-progress guard. Frontend uses existingId to either
    // resume or call abandon.
    const existing = await PracticeSession.findOne({
      userId: userObjId,
      status: 'in_progress',
    }).select('_id');
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'Bạn còn 1 bài đang làm dở, hoàn thành hoặc hủy trước.',
        data: { existingId: existing._id },
      });
    }

    const { topicIds, subjectId } = parsed.data;
    const mode = parsed.data.mode ?? 'adaptive';
    const settings = {
      questionCount: parsed.data.settings?.questionCount ?? 10,
      difficultyRange: (parsed.data.settings?.difficultyRange ?? [1, 3]) as [number, number],
      timeLimitMinutes: parsed.data.settings?.timeLimitMinutes,
    };

    let questions;
    try {
      questions = await selectQuestions({
        topicIds,
        difficultyRange: settings.difficultyRange,
        count: settings.questionCount,
        subjectId,
      });
    } catch (err: any) {
      return res.status(502).json({
        success: false,
        message: 'Question selection failed (bank empty + AI generation failed)',
        error: err?.message,
      });
    }

    if (questions.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No questions available for the requested topics/difficulty.',
      });
    }

    const session = await PracticeSession.create({
      userId: userObjId,
      topicIds: topicIds.map((id) => new mongoose.Types.ObjectId(id)),
      mode,
      settings,
      questions: questions.map((q: any, idx: number) => ({
        questionId: q._id,
        order: idx,
      })),
      adaptiveState: {
        currentDifficulty: settings.difficultyRange[0],
        consecutiveCorrect: 0,
        consecutiveWrong: 0,
      },
    });

    res.status(201).json({
      success: true,
      data: {
        session,
        questions: questions.map((q: any, idx: number) => toPublicQuestion(q, idx)),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const submitAnswer = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;
    const parsed = answerSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: parsed.error.errors,
      });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid session id' });
    }

    const session = await PracticeSession.findOne({
      _id: id,
      userId: new mongoose.Types.ObjectId(userId),
    });
    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }
    if (session.status !== 'in_progress') {
      return res.status(409).json({
        success: false,
        message: `Cannot answer: session is ${session.status}.`,
      });
    }

    const { questionId, answer, timeSpentSeconds, hintUsed } = parsed.data;

    const question = await Question.findById(questionId);
    if (!question) {
      return res.status(404).json({ success: false, message: 'Question not found' });
    }

    const isCorrect = question.content?.correctAnswer === answer;

    const targetIdx = session.questions.findIndex(
      (q) => q.questionId.toString() === questionId,
    );
    if (targetIdx === -1) {
      return res.status(400).json({
        success: false,
        message: 'Question is not part of this session',
      });
    }

    session.questions[targetIdx].userAnswer = answer;
    session.questions[targetIdx].isCorrect = isCorrect;
    session.questions[targetIdx].timeSpentSeconds = timeSpentSeconds ?? null as any;
    session.questions[targetIdx].hintUsed = hintUsed ?? false;

    session.adaptiveState = applyAdaptive(
      session.adaptiveState,
      isCorrect,
      session.mode,
    );

    await session.save();

    // Fire-and-forget usage counter; failure here shouldn't fail the answer.
    Question.findByIdAndUpdate(questionId, { $inc: { usageCount: 1 } }).catch(() => {});

    res.json({
      success: true,
      data: {
        isCorrect,
        explanation: question.content?.explanation ?? '',
        currentDifficulty: session.adaptiveState.currentDifficulty,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const finishSession = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid session id' });
    }

    const userObjId = new mongoose.Types.ObjectId(userId);
    const session = await PracticeSession.findOne({ _id: id, userId: userObjId });
    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }

    // Idempotent — finishing an already-completed session returns the cached
    // results without re-mutating the user's weak-topic list.
    if (session.status === 'completed' && session.results) {
      return res.json({ success: true, data: { session } });
    }

    if (session.status === 'abandoned') {
      return res.status(409).json({
        success: false,
        message: 'Cannot finish: session is abandoned.',
      });
    }

    // Hydrate question→topicIds map so the grader can bucket per topic.
    const questionIds = session.questions.map((q) => q.questionId);
    const questionDocs = await Question.find({ _id: { $in: questionIds } })
      .select('topicIds')
      .lean();
    const topicLookup = new Map<string, mongoose.Types.ObjectId[]>();
    for (const qd of questionDocs) {
      topicLookup.set(qd._id.toString(), qd.topicIds as any);
    }

    const results = computePracticeResults({ questions: session.questions }, topicLookup);

    session.results = results;
    session.status = 'completed';
    session.completedAt = new Date();
    await session.save();

    if (results.weakTopicIds.length > 0) {
      await User.updateOne(
        { _id: userObjId },
        { $addToSet: { 'currentLevel.weakTopics': { $each: results.weakTopicIds } } },
      );
    }

    res.json({ success: true, data: { session } });
  } catch (error) {
    next(error);
  }
};

export const abandonSession = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid session id' });
    }

    const session = await PracticeSession.findOne({
      _id: id,
      userId: new mongoose.Types.ObjectId(userId),
    });
    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }
    if (session.status !== 'in_progress') {
      return res.status(409).json({
        success: false,
        message: 'Cannot abandon: already completed or abandoned.',
      });
    }

    session.status = 'abandoned';
    session.completedAt = new Date();
    await session.save();

    res.json({ success: true, message: 'Session abandoned' });
  } catch (error) {
    next(error);
  }
};

export const listSessions = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user!.userId;
    const { status, topicId, page = 1, limit = 20 } = req.query;

    const filter: any = { userId: new mongoose.Types.ObjectId(userId) };
    if (status) filter.status = status;
    if (topicId && mongoose.Types.ObjectId.isValid(topicId as string)) {
      filter.topicIds = new mongoose.Types.ObjectId(topicId as string);
    }

    const skip = (Number(page) - 1) * Number(limit);
    const sessions = await PracticeSession.find(filter)
      .select('-questions')
      .sort({ startedAt: -1 })
      .skip(skip)
      .limit(Number(limit));
    const total = await PracticeSession.countDocuments(filter);

    res.json({
      success: true,
      data: {
        sessions,
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

export const getSessionById = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid session id' });
    }

    const session = await PracticeSession.findOne({
      _id: id,
      userId: new mongoose.Types.ObjectId(userId),
    });
    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }

    res.json({ success: true, data: { session } });
  } catch (error) {
    next(error);
  }
};

// Enrich the user's stored weak-topic ids with topic names from Subject.topics.
export const getWeakTopics = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user!.userId;
    const user = await User.findById(userId).select('currentLevel').lean();
    const weakIds = (user?.currentLevel?.weakTopics ?? []) as mongoose.Types.ObjectId[];

    if (weakIds.length === 0) {
      return res.json({ success: true, data: { weakTopics: [] } });
    }

    const subjects = await Subject.find({ 'topics._id': { $in: weakIds } })
      .select('name code topics')
      .lean();

    const idToName = new Map<string, { topicName: string; subjectName: string; subjectCode: string }>();
    for (const s of subjects) {
      for (const t of s.topics ?? []) {
        idToName.set(t._id.toString(), {
          topicName: t.name,
          subjectName: s.name,
          subjectCode: s.code,
        });
      }
    }

    const weakTopics = weakIds.map((tid) => {
      const meta = idToName.get(tid.toString());
      return {
        topicId: tid,
        topicName: meta?.topicName ?? null,
        subjectName: meta?.subjectName ?? null,
        subjectCode: meta?.subjectCode ?? null,
      };
    });

    res.json({ success: true, data: { weakTopics } });
  } catch (error) {
    next(error);
  }
};
