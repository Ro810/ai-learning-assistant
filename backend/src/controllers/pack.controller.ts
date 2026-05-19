// Pack controllers: list packs per subject + pack detail with parts/progress.
// listPacksBySubject: public, mounted ở subject.routes -> GET /api/subjects/:id/packs
// getPackDetail: auth required, mounted ở pack.routes -> GET /api/packs/:packId

import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { TestPack } from '../models/test-pack.model';
import { Question } from '../models/question.model';
import { Subject } from '../models/subject.model';
import { Assessment } from '../models/assessment.model';

// GET /api/subjects/:id/packs
export const listPacksBySubject = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid subject id' });
    }

    const packs = await TestPack.find({ subjectId: id })
      .sort({ order: 1 })
      .select('_id subjectId name order description totalQuestions')
      .lean();

    res.json({ success: true, data: { packs } });
  } catch (error) {
    next(error);
  }
};

// GET /api/packs/:packId
// Trả pack + 6 parts (topicId/topicName/questionCount) + user progress (assessment đã completed per topic).
export const getPackDetail = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.userId;
    const { packId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(packId)) {
      return res.status(400).json({ success: false, message: 'Invalid pack id' });
    }

    const pack = await TestPack.findById(packId).lean();
    if (!pack) {
      return res.status(404).json({ success: false, message: 'Pack not found' });
    }

    const subject = await Subject.findById(pack.subjectId)
      .select('name code topics')
      .lean();
    if (!subject) {
      return res.status(404).json({ success: false, message: 'Subject not found' });
    }

    // Đếm câu theo topic trong pack.
    const counts = await Question.aggregate<{ _id: mongoose.Types.ObjectId; count: number }>([
      { $match: { packId: new mongoose.Types.ObjectId(packId) } },
      { $unwind: '$topicIds' },
      { $group: { _id: '$topicIds', count: { $sum: 1 } } },
    ]);
    const countByTopic = new Map<string, number>(
      counts.map((c) => [c._id.toString(), c.count])
    );

    const parts = (subject.topics ?? [])
      .map((t: any) => ({
        topicId: t._id.toString(),
        topicName: t.name,
        questionCount: countByTopic.get(t._id.toString()) ?? 0,
      }))
      .filter((p) => p.questionCount > 0);

    // Progress: assessment user đã completed cho pack này, group by topicId.
    let progress: Array<{ topicId: string; assessmentId: string; score: number }> = [];
    if (userId) {
      const userAssessments = await Assessment.find({
        userId: new mongoose.Types.ObjectId(userId),
        packId: new mongoose.Types.ObjectId(packId),
        status: 'completed',
      })
        .select('_id questions results')
        .sort({ completedAt: -1 })
        .lean();

      const seen = new Set<string>();
      for (const a of userAssessments) {
        const topicIdRaw = a.questions?.[0]?.questionSnapshot?.topicIds?.[0];
        if (!topicIdRaw) continue;
        const topicId = topicIdRaw.toString();
        if (seen.has(topicId)) continue;
        seen.add(topicId);
        progress.push({
          topicId,
          assessmentId: a._id.toString(),
          score: a.results?.score ?? 0,
        });
      }
    }

    res.json({
      success: true,
      data: {
        pack,
        subject: { _id: subject._id, name: subject.name, code: subject.code },
        parts,
        progress,
      },
    });
  } catch (error) {
    next(error);
  }
};
