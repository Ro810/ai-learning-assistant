import { Router } from 'express';
import {
  createAssessment,
  submitAssessment,
  abandonAssessment,
  listAssessments,
  getAssessmentById,
  deleteAssessment,
} from '../controllers/assessment.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware);

/**
 * @swagger
 * /api/assessments:
 *   post:
 *     summary: Create a new assessment (entry test)
 *     tags: [Assessments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [subjectId]
 *             properties:
 *               subjectId:
 *                 type: string
 *               topicIds:
 *                 type: array
 *                 items: { type: string }
 *               difficulty:
 *                 type: number
 *                 enum: [1, 2, 3]
 *                 default: 2
 *               questionCount:
 *                 type: number
 *                 default: 10
 *                 maximum: 40
 *               packId:
 *                 type: string
 *                 description: If provided, skip AI and pull pre-seeded questions for this pack.
 *     responses:
 *       201: { description: Assessment created with generated questions }
 *       400: { description: Validation error }
 *       409: { description: User has an in-progress assessment for this subject }
 *       502: { description: AI generation failed }
 */
router.post('/', createAssessment);

/**
 * @swagger
 * /api/assessments:
 *   get:
 *     summary: List user's assessments
 *     tags: [Assessments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: subjectId
 *         schema: { type: string }
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [in_progress, completed, abandoned]
 *       - in: query
 *         name: page
 *         schema: { type: number, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: number, default: 20 }
 *     responses:
 *       200: { description: Assessment list }
 */
router.get('/', listAssessments);

/**
 * @swagger
 * /api/assessments/{id}:
 *   get:
 *     summary: Get assessment by id (answer key revealed only when completed)
 *     tags: [Assessments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Assessment details }
 *       404: { description: Not found }
 */
router.get('/:id', getAssessmentById);

/**
 * @swagger
 * /api/assessments/{id}/submit:
 *   post:
 *     summary: Submit answers and auto-grade
 *     tags: [Assessments]
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
 *             required: [answers]
 *             properties:
 *               answers:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [questionId, answer]
 *                   properties:
 *                     questionId: { type: string }
 *                     answer: { type: string }
 *                     timeSpentSeconds: { type: number }
 *     responses:
 *       200: { description: Graded assessment with results }
 *       409: { description: Assessment not in progress }
 */
router.post('/:id/submit', submitAssessment);

/**
 * @swagger
 * /api/assessments/{id}/abandon:
 *   post:
 *     summary: Abandon an in-progress assessment
 *     tags: [Assessments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Assessment abandoned }
 *       409: { description: Assessment is not in progress }
 */
router.post('/:id/abandon', abandonAssessment);

/**
 * @swagger
 * /api/assessments/{id}:
 *   delete:
 *     summary: Delete an assessment
 *     tags: [Assessments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Assessment deleted }
 *       404: { description: Not found }
 */
router.delete('/:id', deleteAssessment);

export default router;
