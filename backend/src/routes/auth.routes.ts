import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authService } from '../services/auth.service';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// Validation schemas
const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  grade: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
});

const changeEmailSchema = z.object({
  password: z.string().min(1, 'Password is required'),
  newEmail: z.string().email('Invalid email format'),
});

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - name
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 6
 *               name:
 *                 type: string
 *                 minLength: 2
 *               grade:
 *                 type: string
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Validation error or user already exists
 */
router.post('/register', async (req: Request, res: Response) => {
  try {
    // Validate input
    const validation = registerSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: validation.error.errors,
      });
      return;
    }

    // Register user
    const result = await authService.register(validation.data);

    res.status(201).json({
      success: true,
      data: result,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Registration failed';
    res.status(400).json({
      success: false,
      message,
    });
  }
});

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 */
router.post('/login', async (req: Request, res: Response) => {
  try {
    // Validate input
    const validation = loginSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: validation.error.errors,
      });
      return;
    }

    // Login user
    const { email, password } = validation.data;
    const result = await authService.login(email, password);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Login failed';
    res.status(401).json({
      success: false,
      message,
    });
  }
});

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get current user
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User data
 *       401:
 *         description: Unauthorized
 */
router.get('/me', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = await authService.getCurrentUser(req.user!.userId);

    res.json({
      success: true,
      data: {
        id: user._id,
        email: user.email,
        profile: user.profile,
        learningGoals: user.learningGoals,
        currentLevel: user.currentLevel,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get user';
    res.status(400).json({
      success: false,
      message,
    });
  }
});

/**
 * @swagger
 * /api/auth/password:
 *   patch:
 *     summary: Change current user's password
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [currentPassword, newPassword]
 *             properties:
 *               currentPassword: { type: string }
 *               newPassword: { type: string, minLength: 8 }
 *     responses:
 *       200: { description: Password changed }
 *       400: { description: Validation error }
 *       401: { description: Invalid current password }
 */
router.patch('/password', authMiddleware, async (req: Request, res: Response) => {
  const validation = changePasswordSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: validation.error.errors,
    });
  }
  try {
    await authService.changePassword(
      req.user!.userId,
      validation.data.currentPassword,
      validation.data.newPassword,
    );
    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Password change failed';
    const status = message === 'Invalid current password' ? 401 : 400;
    res.status(status).json({ success: false, message });
  }
});

/**
 * @swagger
 * /api/auth/email:
 *   patch:
 *     summary: Change current user's email (requires password proof)
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [password, newEmail]
 *             properties:
 *               password: { type: string }
 *               newEmail: { type: string, format: email }
 *     responses:
 *       200: { description: Email changed }
 *       400: { description: Validation error }
 *       401: { description: Invalid password }
 *       409: { description: Email already in use }
 */
router.patch('/email', authMiddleware, async (req: Request, res: Response) => {
  const validation = changeEmailSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: validation.error.errors,
    });
  }
  try {
    const user = await authService.changeEmail(
      req.user!.userId,
      validation.data.password,
      validation.data.newEmail,
    );
    res.json({ success: true, data: { user } });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Email change failed';
    let status = 400;
    if (message === 'Invalid password') status = 401;
    else if (message === 'Email already in use') status = 409;
    res.status(status).json({ success: false, message });
  }
});

export default router;
