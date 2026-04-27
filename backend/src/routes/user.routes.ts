import { Router } from 'express';
import {
  updateProfile,
  replaceLearningGoals,
  addLearningGoal,
  removeLearningGoal,
  setCurrentLevel,
} from '../controllers/user.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware);

/**
 * @swagger
 * /api/users/me:
 *   patch:
 *     summary: Update current user's profile (name/avatar/grade)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               profile:
 *                 type: object
 *                 properties:
 *                   name: { type: string }
 *                   avatarUrl: { type: string, format: uri }
 *                   grade: { type: string }
 *     responses:
 *       200: { description: User updated }
 *       400: { description: Validation error }
 */
router.patch('/me', updateProfile);

/**
 * @swagger
 * /api/users/me/learning-goals:
 *   put:
 *     summary: Replace the entire learning goals array
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [goals]
 *             properties:
 *               goals:
 *                 type: array
 *                 maxItems: 10
 *                 items:
 *                   type: object
 *                   required: [subjectId, targetLevel, targetDate]
 *                   properties:
 *                     subjectId: { type: string }
 *                     targetLevel: { type: string, enum: [basic, intermediate, advanced] }
 *                     targetDate: { type: string, format: date }
 *     responses:
 *       200: { description: Goals replaced }
 *       400: { description: Validation / dup / unknown subjectId }
 */
router.put('/me/learning-goals', replaceLearningGoals);

/**
 * @swagger
 * /api/users/me/learning-goals:
 *   post:
 *     summary: Append a single learning goal
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [subjectId, targetLevel, targetDate]
 *             properties:
 *               subjectId: { type: string }
 *               targetLevel: { type: string, enum: [basic, intermediate, advanced] }
 *               targetDate: { type: string, format: date }
 *     responses:
 *       201: { description: Goal added }
 *       409: { description: Goal already exists for this subject }
 */
router.post('/me/learning-goals', addLearningGoal);

/**
 * @swagger
 * /api/users/me/learning-goals/{subjectId}:
 *   delete:
 *     summary: Remove the learning goal for a subject
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: subjectId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Goal removed }
 */
router.delete('/me/learning-goals/:subjectId', removeLearningGoal);

/**
 * @swagger
 * /api/users/me/current-level:
 *   patch:
 *     summary: Set current level for a subject
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [subjectId, level]
 *             properties:
 *               subjectId: { type: string }
 *               level: { type: string }
 *     responses:
 *       200: { description: Current level updated }
 */
router.patch('/me/current-level', setCurrentLevel);

export default router;
