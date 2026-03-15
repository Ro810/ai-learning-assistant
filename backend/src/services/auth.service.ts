import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { IUserInput, IAuthPayload, IAuthResponse } from '../types';

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

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

      const token = jwt.sign({ userId, email }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN as any });
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

    const token = jwt.sign(
      { userId: user._id.toString(), email: user.email },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN as any }
    );

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

      const token = jwt.sign({ userId: user._id, email }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN as any });
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

    const token = jwt.sign(
      { userId: user._id.toString(), email: user.email },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN as any }
    );

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
   * Generate JWT token
   */
  private generateToken(payload: IAuthPayload): string {
    return jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN as any,
    });
  }

  /**
   * Verify JWT token
   */
  verifyToken(token: string): IAuthPayload {
    return jwt.verify(token, JWT_SECRET) as IAuthPayload;
  }
}

export const authService = new AuthService();
