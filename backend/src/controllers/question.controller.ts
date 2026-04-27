import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { questionGenerator } from '../services/question-generator.service';
import { Question } from '../models/question.model';
import mongoose from 'mongoose';

const generateQuestionsSchema = z.object({
  subjectId: z.string().optional(),
  topicIds: z.array(z.string()).min(1, 'topicIds must contain at least one topic'),
  difficulty: z.union([z.literal(1), z.literal(2), z.literal(3)]).optional(),
  count: z.number().int().min(1).max(50).optional(),
  questionType: z.literal('multiple_choice').optional(),
});

export const generateQuestions = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const parsed = generateQuestionsSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: parsed.error.errors,
      });
    }

    const { subjectId, topicIds, difficulty, count, questionType } = parsed.data;

    const questions = await questionGenerator.generate({
      subjectId: subjectId ?? '',
      topicIds,
      difficulty: difficulty ?? 2,
      count: count ?? 5,
      questionType: questionType ?? 'multiple_choice',
    });

    res.status(201).json({
      success: true,
      data: { questions },
    });
  } catch (error) {
    next(error);
  }
};

export const getQuestions = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { topicId, difficulty, page = 1, limit = 20 } = req.query;

    const filter: any = {};
    if (topicId) {
      filter.topicIds = new mongoose.Types.ObjectId(topicId as string);
    }
    if (difficulty) {
      filter.difficulty = Number(difficulty);
    }

    const skip = (Number(page) - 1) * Number(limit);

    const questions = await Question.find(filter)
      .skip(skip)
      .limit(Number(limit))
      .sort({ createdAt: -1 });

    const total = await Question.countDocuments(filter);

    res.json({
      success: true,
      data: {
        questions,
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

export const getQuestionById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const question = await Question.findById(id);

    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found',
      });
    }

    res.json({
      success: true,
      data: { question },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteQuestion = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const question = await Question.findByIdAndDelete(id);

    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found',
      });
    }

    res.json({
      success: true,
      message: 'Question deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
