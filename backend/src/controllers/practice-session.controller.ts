import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import mongoose from 'mongoose';
import { PracticeSession } from '../models/practice-session.model';
import { Question } from '../models/question.model';
import { User } from '../models/user.model';
import { Subject } from '../models/subject.model';
import { Assessment } from '../models/assessment.model';
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

// Aggregate per-topic stats from completed practice sessions + assessments,
// enrich with topic + subject names. Returns every topic the user has
// touched (caller filters by rate < 0.5 on the client side).
export const getWeakTopics = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user!.userId);

    // 1. Practice sessions: only completed; need question.topicIds for each
    //    answered item -> bulk-load all referenced questions in one query.
    const sessions = await PracticeSession.find({
      userId,
      status: 'completed',
    })
      .select('questions')
      .lean();

    const questionIds = new Set<string>();
    for (const s of sessions) {
      for (const q of s.questions ?? []) {
        if (q.questionId) questionIds.add(q.questionId.toString());
      }
    }

    const questions = questionIds.size
      ? await Question.find({ _id: { $in: Array.from(questionIds) } })
          .select('topicIds')
          .lean()
      : [];

    const qIdToTopics = new Map<string, mongoose.Types.ObjectId[]>();
    for (const q of questions) {
      qIdToTopics.set(q._id.toString(), q.topicIds ?? []);
    }

    // 2. Assessments: skillAnalysis already has { topicId, correct, total }
    //    per topic — just sum it in.
    const assessments = await Assessment.find({
      userId,
      status: 'completed',
    })
      .select('results.skillAnalysis')
      .lean();

    // 3. Combine into one bucket per topicId.
    type Bucket = { topicId: mongoose.Types.ObjectId; correct: number; total: number };
    const buckets = new Map<string, Bucket>();

    const bump = (topicId: mongoose.Types.ObjectId, isCorrect: boolean) => {
      const key = topicId.toString();
      const b = buckets.get(key) ?? { topicId, correct: 0, total: 0 };
      b.total += 1;
      if (isCorrect) b.correct += 1;
      buckets.set(key, b);
    };

    for (const s of sessions) {
      for (const q of s.questions ?? []) {
        if (q.isCorrect === null || q.isCorrect === undefined) continue;
        const topics = qIdToTopics.get(q.questionId?.toString?.() ?? '') ?? [];
        if (topics.length === 0) continue;
        bump(topics[0], !!q.isCorrect); // primary topic only — same convention as grader
      }
    }

    for (const a of assessments) {
      for (const sa of a.results?.skillAnalysis ?? []) {
        const key = sa.topicId.toString();
        const b = buckets.get(key) ?? { topicId: sa.topicId, correct: 0, total: 0 };
        b.correct += sa.correct ?? 0;
        b.total += sa.total ?? 0;
        buckets.set(key, b);
      }
    }

    if (buckets.size === 0) {
      return res.json({ success: true, data: { items: [] } });
    }

    // 4. Enrich with topic + subject names in a single Subject query.
    const topicIds = Array.from(buckets.values()).map((b) => b.topicId);
    const subjects = await Subject.find({ 'topics._id': { $in: topicIds } })
      .select('name code topics')
      .lean();

    const idToMeta = new Map<
      string,
      { topicName: string; subjectId: mongoose.Types.ObjectId; subjectName: string }
    >();
    for (const s of subjects) {
      for (const t of s.topics ?? []) {
        idToMeta.set(t._id.toString(), {
          topicName: t.name,
          subjectId: s._id,
          subjectName: s.name,
        });
      }
    }

    const items = Array.from(buckets.values())
      .filter((b) => b.total > 0)
      .map((b) => {
        const meta = idToMeta.get(b.topicId.toString());
        return {
          topicId: b.topicId,
          topicName: meta?.topicName ?? null,
          subjectId: meta?.subjectId ?? null,
          subjectName: meta?.subjectName ?? null,
          correct: b.correct,
          total: b.total,
          rate: b.correct / b.total,
        };
      });

    res.json({ success: true, data: { items } });
  } catch (error) {
    next(error);
  }
};
