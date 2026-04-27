import { Router } from 'express';
import {
  generateQuestions,
  getQuestions,
  getQuestionById,
  deleteQuestion,
} from '../controllers/question.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

/**
 * @swagger
 * /api/questions/generate:
 *   post:
 *     summary: Generate questions using AI
 *     tags: [Questions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - topicIds
 *             properties:
 *               subjectId:
 *                 type: string
 *               topicIds:
 *                 type: array
 *                 items:
 *                   type: string
 *               difficulty:
 *                 type: number
 *                 enum: [1, 2, 3]
 *                 default: 2
 *               count:
 *                 type: number
 *                 default: 5
 *               questionType:
 *                 type: string
 *                 enum: [multiple_choice]
 *                 default: multiple_choice
 *     responses:
 *       201:
 *         description: Questions generated successfully
 *       400:
 *         description: Validation error
 */
router.post('/generate', generateQuestions);

/**
 * @swagger
 * /api/questions:
 *   get:
 *     summary: Get all questions with filters
 *     tags: [Questions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: topicId
 *         schema:
 *           type: string
 *       - in: query
 *         name: difficulty
 *         schema:
 *           type: number
 *       - in: query
 *         name: page
 *         schema:
 *           type: number
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *           default: 20
 *     responses:
 *       200:
 *         description: Questions list
 */
router.get('/', getQuestions);

/**
 * @swagger
 * /api/questions/{id}:
 *   get:
 *     summary: Get question by ID
 *     tags: [Questions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Question details
 *       404:
 *         description: Question not found
 */
router.get('/:id', getQuestionById);

/**
 * @swagger
 * /api/questions/{id}:
 *   delete:
 *     summary: Delete a question
 *     tags: [Questions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Question deleted
 *       404:
 *         description: Question not found
 */
router.delete('/:id', deleteQuestion);

export default router;
