import { Router } from 'express';
import {
  createLearningPath,
  getLearningPaths,
  getLearningPathById,
  updateLearningPath,
  deleteLearningPath,
} from '../controllers/learning-path.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

/**
 * @swagger
 * /api/learning-paths:
 *   post:
 *     summary: Create a new learning path
 *     tags: [Learning Paths]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - subjectId
 *               - assessmentId
 *               - targetDate
 *               - targetLevel
 *             properties:
 *               subjectId:
 *                 type: string
 *               assessmentId:
 *                 type: string
 *               targetDate:
 *                 type: string
 *                 format: date
 *               targetLevel:
 *                 type: string
 *                 enum: [basic, intermediate, advanced]
 *               weeklyStudyHours:
 *                 type: number
 *                 default: 10
 *     responses:
 *       201:
 *         description: Learning path created
 *       400:
 *         description: Validation error
 */
router.post('/', createLearningPath);

/**
 * @swagger
 * /api/learning-paths:
 *   get:
 *     summary: Get user's learning paths
 *     tags: [Learning Paths]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: subjectId
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, completed, paused]
 *     responses:
 *       200:
 *         description: Learning paths list
 */
router.get('/', getLearningPaths);

/**
 * @swagger
 * /api/learning-paths/{id}:
 *   get:
 *     summary: Get learning path by ID
 *     tags: [Learning Paths]
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
 *         description: Learning path details
 *       404:
 *         description: Learning path not found
 */
router.get('/:id', getLearningPathById);

/**
 * @swagger
 * /api/learning-paths/{id}:
 *   put:
 *     summary: Update learning path progress
 *     tags: [Learning Paths]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               milestoneId:
 *                 type: string
 *               action:
 *                 type: string
 *                 enum: [complete, update_progress]
 *               completionRate:
 *                 type: number
 *     responses:
 *       200:
 *         description: Learning path updated
 *       404:
 *         description: Learning path not found
 */
router.put('/:id', updateLearningPath);

/**
 * @swagger
 * /api/learning-paths/{id}:
 *   delete:
 *     summary: Delete a learning path
 *     tags: [Learning Paths]
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
 *         description: Learning path deleted
 *       404:
 *         description: Learning path not found
 */
router.delete('/:id', deleteLearningPath);

export default router;
