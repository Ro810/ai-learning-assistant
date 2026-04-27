import { Router } from 'express';
import {
  createSession,
  submitAnswer,
  finishSession,
  abandonSession,
  listSessions,
  getSessionById,
  getWeakTopics,
} from '../controllers/practice-session.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware);

/**
 * @swagger
 * /api/practice-sessions:
 *   post:
 *     summary: Start a new practice session
 *     tags: [Practice Sessions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [topicIds]
 *             properties:
 *               topicIds:
 *                 type: array
 *                 items: { type: string }
 *               mode:
 *                 type: string
 *                 enum: [adaptive, exam_simulation]
 *                 default: adaptive
 *               subjectId:
 *                 type: string
 *               settings:
 *                 type: object
 *                 properties:
 *                   questionCount: { type: number, default: 10, maximum: 50 }
 *                   difficultyRange:
 *                     type: array
 *                     items: { type: number }
 *                     default: [1, 3]
 *                   timeLimitMinutes: { type: number }
 *     responses:
 *       201: { description: Session created }
 *       409: { description: User has another in-progress session }
 *       502: { description: Question selection failed }
 */
router.post('/', createSession);

/**
 * @swagger
 * /api/practice-sessions:
 *   get:
 *     summary: List user's practice sessions
 *     tags: [Practice Sessions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [in_progress, completed, abandoned]
 *       - in: query
 *         name: topicId
 *         schema: { type: string }
 *       - in: query
 *         name: page
 *         schema: { type: number, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: number, default: 20 }
 *     responses:
 *       200: { description: Sessions list }
 */
router.get('/', listSessions);

/**
 * @swagger
 * /api/practice-sessions/analytics/weak-topics:
 *   get:
 *     summary: Get current user's weak topics enriched with names
 *     tags: [Practice Sessions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: { description: Weak topics list with topic + subject names }
 */
router.get('/analytics/weak-topics', getWeakTopics);

/**
 * @swagger
 * /api/practice-sessions/{id}:
 *   get:
 *     summary: Get session by id
 *     tags: [Practice Sessions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Session details }
 *       404: { description: Not found }
 */
router.get('/:id', getSessionById);

/**
 * @swagger
 * /api/practice-sessions/{id}/answer:
 *   post:
 *     summary: Submit a single answer (auto-grade + adaptive update)
 *     tags: [Practice Sessions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [questionId, answer]
 *             properties:
 *               questionId: { type: string }
 *               answer: { type: string }
 *               timeSpentSeconds: { type: number }
 *               hintUsed: { type: boolean }
 *     responses:
 *       200: { description: Answer graded with explanation }
 *       409: { description: Session not in progress }
 */
router.post('/:id/answer', submitAnswer);

/**
 * @swagger
 * /api/practice-sessions/{id}/finish:
 *   post:
 *     summary: Finish session, compute results, update weak topics
 *     tags: [Practice Sessions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Session completed with results (idempotent) }
 *       409: { description: Session was abandoned }
 */
router.post('/:id/finish', finishSession);

/**
 * @swagger
 * /api/practice-sessions/{id}/abandon:
 *   post:
 *     summary: Abandon an in-progress session
 *     tags: [Practice Sessions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Session abandoned }
 *       409: { description: Session not in progress }
 */
router.post('/:id/abandon', abandonSession);

export default router;
