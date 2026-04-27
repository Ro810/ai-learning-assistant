import { Router } from 'express';
import { listSubjects, getSubject } from '../controllers/subject.controller';

const router = Router();

// Read-only catalog endpoints. Subject/topic data is curated via the seed
// script (`npm run seed:subjects`); there are intentionally no write routes.
// Public access — no auth middleware applied.

/**
 * @swagger
 * /api/subjects:
 *   get:
 *     summary: List curated subjects (catalog)
 *     tags: [Subjects]
 *     parameters:
 *       - in: query
 *         name: withTopics
 *         schema:
 *           type: boolean
 *         description: Include embedded topics array (default false; topicCount only)
 *     responses:
 *       200:
 *         description: Subject list
 */
router.get('/', listSubjects);

/**
 * @swagger
 * /api/subjects/{id}:
 *   get:
 *     summary: Get subject by id (with full topics tree)
 *     tags: [Subjects]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Subject details
 *       400:
 *         description: Invalid subject id
 *       404:
 *         description: Subject not found
 */
router.get('/:id', getSubject);

export default router;
