// Pack routes — mount at /api/packs.
// listPacksBySubject lives ở subject.routes (/api/subjects/:id/packs) để giữ URL gần subject.

import { Router } from 'express';
import { getPackDetail } from '../controllers/pack.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware);

/**
 * @swagger
 * /api/packs/{packId}:
 *   get:
 *     summary: Get a TestPack with its parts (topics) and user's progress
 *     tags: [Packs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: packId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Pack detail with parts + progress }
 *       400: { description: Invalid pack id }
 *       404: { description: Pack not found }
 */
router.get('/:packId', getPackDetail);

export default router;
