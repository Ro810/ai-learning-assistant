import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { IUserInput, IAuthPayload, IAuthResponse } from '../types';

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

const signToken = (payload: IAuthPayload): string =>
  jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN as any });

// Mock mode: Use in-memory storage when MONGODB_URI contains "mock"
const USE_MOCK = process.env.MONGODB_URI === 'mock';

// In-memory mock storage
interface MockUser {
  _id: string;
  email: string;
  passwordHash: string;
  profile: { name: string; grade?: string; avatarUrl?: string };
  learningGoals: string[];
  currentLevel: string;
  createdAt: Date;
  comparePassword: (pwd: string) => Promise<boolean>;
}

const mockUsers: Map<string, MockUser> = new Map();
let mockIdCounter = 1;

export class AuthService {
  /**
   * Register a new user
   */
  async register(userData: IUserInput): Promise<IAuthResponse> {
    const { email, password, name, grade } = userData;

    if (USE_MOCK) {
      // Mock mode: use in-memory storage
      if (mockUsers.has(email)) {
        throw new Error('Email already registered');
      }

      const passwordHash = await bcrypt.hash(password, 12);
      const userId = `mock-${mockIdCounter++}`;
      const mockUser: MockUser = {
        _id: userId,
        email,
        passwordHash,
        profile: { name, grade: grade || undefined },
        learningGoals: [],
        currentLevel: 'beginner',
        createdAt: new Date(),
        comparePassword: async (pwd: string) => bcrypt.compare(pwd, passwordHash),
      };

      mockUsers.set(email, mockUser);

      const token = signToken({ userId, email });
      return { token, user: { id: userId, email, name } };
    }

    // Real mode: use dynamic import to avoid mongoose buffering issues
    const { User, hashPassword } = await import('../models/user.model');

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new Error('Email already registered');
    }

    const passwordHash = await hashPassword(password);
    const user = await User.create({
      email,
      passwordHash,
      profile: { name, grade },
      learningGoals: [],
    });

    const token = signToken({ userId: user._id.toString(), email: user.email });

    return {
      token,
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.profile.name,
      },
    };
  }

  /**
   * Login user
   */
  async login(email: string, password: string): Promise<IAuthResponse> {
    if (USE_MOCK) {
      const user = mockUsers.get(email);
      if (!user) {
        throw new Error('Invalid email or password');
      }

      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        throw new Error('Invalid email or password');
      }

      const token = signToken({ userId: user._id, email });
      return { token, user: { id: user._id, email, name: user.profile.name } };
    }

    // Real mode
    const { User } = await import('../models/user.model');
    const user = await User.findOne({ email });
    if (!user) {
      throw new Error('Invalid email or password');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new Error('Invalid email or password');
    }

    const token = signToken({ userId: user._id.toString(), email: user.email });

    return {
      token,
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.profile.name,
      },
    };
  }

  /**
   * Get current user by ID
   */
  async getCurrentUser(userId: string) {
    if (USE_MOCK) {
      const user = Array.from(mockUsers.values()).find(u => u._id === userId);
      if (!user) {
        throw new Error('User not found');
      }
      return user;
    }

    const { User } = await import('../models/user.model');
    const user = await User.findById(userId).select('-passwordHash');
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  }

  /**
   * Verify JWT token
   */
  verifyToken(token: string): IAuthPayload {
    return jwt.verify(token, JWT_SECRET) as IAuthPayload;
  }

  /**
   * Change password — verifies the current password before hashing the new one.
   * Throws specific Error messages so the route layer can map to 401 vs 500.
   */
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    if (USE_MOCK) {
      throw new Error('Password change is not supported in mock mode');
    }
    const { User, hashPassword } = await import('../models/user.model');
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    const ok = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!ok) throw new Error('Invalid current password');

    user.passwordHash = await hashPassword(newPassword);
    await user.save();
  }

  /**
   * Change email — verifies the password and ensures the new email is free.
   * Returns the updated user (no passwordHash).
   */
  async changeEmail(
    userId: string,
    password: string,
    newEmail: string,
  ): Promise<any> {
    if (USE_MOCK) {
      throw new Error('Email change is not supported in mock mode');
    }
    const normalized = newEmail.toLowerCase().trim();

    const { User } = await import('../models/user.model');
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw new Error('Invalid password');

    if (user.email === normalized) {
      throw new Error('New email is the same as current email');
    }

    const taken = await User.findOne({ email: normalized }).select('_id');
    if (taken) throw new Error('Email already in use');

    user.email = normalized;
    await user.save();

    const result = user.toObject();
    delete (result as any).passwordHash;
    return result;
  }
}

export const authService = new AuthService();
