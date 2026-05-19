import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { Subject } from '../models/subject.model';

// GET /api/subjects?withTopics=true
// Lists curated subject catalog. By default returns lightweight rows with
// topicCount; pass ?withTopics=true to include the embedded topics array.
export const listSubjects = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const withTopics = req.query.withTopics === 'true';

    // Ẩn các môn đã deprecated (vd: ielts cũ) khỏi catalog UI.
    const subjects = await Subject.find({ deprecated: { $ne: true } })
      .sort({ name: 1 })
      .lean();

    const data = subjects.map((s) => {
      const base = {
        _id: s._id,
        name: s.name,
        code: s.code,
        description: s.description,
        topicCount: s.topics?.length ?? 0,
      };
      return withTopics ? { ...base, topics: s.topics ?? [] } : base;
    });

    res.json({
      success: true,
      data: { subjects: data },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/subjects/:id
// Returns full subject document including topics tree.
export const getSubject = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid subject id',
      });
    }

    const subject = await Subject.findById(id).lean();

    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found',
      });
    }

    res.json({
      success: true,
      data: { subject },
    });
  } catch (error) {
    next(error);
  }
};
