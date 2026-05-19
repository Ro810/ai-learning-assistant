import { Router } from 'express';
import { listSubjects, getSubject } from '../controllers/subject.controller';
import { listPacksBySubject } from '../controllers/pack.controller';

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

/**
 * @swagger
 * /api/subjects/{id}/packs:
 *   get:
 *     summary: List pre-seeded TestPacks for a subject (vd. English THPT đề 1-10)
 *     tags: [Subjects, Packs]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Pack list sorted by order asc }
 *       400: { description: Invalid subject id }
 */
router.get('/:id/packs', listPacksBySubject);

export default router;
