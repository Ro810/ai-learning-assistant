# Week 2: Backend Setup Report

## 1. Khởi Tạo Express Server

### 1.1 Cấu trúc thư mục

```
backend/
├── src/
│   ├── config/
│   │   └── database.ts          # Kết nối MongoDB
│   ├── middleware/
│   │   └── auth.middleware.ts   # JWT authentication
│   ├── models/
│   │   ├── user.model.ts        # User schema
│   │   └── ...
│   ├── routes/
│   │   └── auth.routes.ts       # Auth API routes
│   ├── services/
│   │   └── auth.service.ts      # Business logic
│   ├── types/
│   │   └── index.ts             # TypeScript interfaces
│   ├── app.ts                   # Express app setup
│   └── server.ts                # Entry point
├── package.json
├── tsconfig.json
└── .env.example
```

### 1.2 Cài đặt dependencies

```bash
cd backend
npm init -y

# Dependencies chính
npm install express mongoose cors dotenv bcryptjs jsonwebtoken zod

# Dev dependencies
npm install -D typescript ts-node-dev @types/express @types/node
npm install -D @types/bcryptjs @types/jsonwebtoken @types/cors
```

### 1.3 File package.json

```json
{
  "name": "ai-learning-backend",
  "version": "1.0.0",
  "main": "dist/server.js",
  "scripts": {
    "dev": "ts-node-dev --respawn --transpile-only src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js"
  },
  "dependencies": {
    "bcryptjs": "^2.4.3",
    "cors": "^2.8.5",
    "dotenv": "^16.4.5",
    "express": "^4.18.3",
    "jsonwebtoken": "^9.0.2",
    "mongoose": "^8.2.0",
    "zod": "^3.22.4"
  }
}
```

### 1.4 Express App (src/app.ts)

```typescript
import express, { Application } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes';
import connectDB from './config/database';

dotenv.config();

const app: Application = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Server is running' });
});

// Error handler
app.use((err: Error, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

// Connect to database
connectDB();

export default app;
```

### 1.5 Server Entry Point (src/server.ts)

```typescript
import app from './app';

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`API URL: http://localhost:${PORT}/api`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => process.exit(0));
});
```

---

## 2. Cấu Hình MongoDB

### 2.1 Kết nối Database (src/config/database.ts)

```typescript
import mongoose from 'mongoose';

const connectDB = async (): Promise<void> => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ai-learning';
    await mongoose.connect(mongoURI);
    console.log('MongoDB Connected Successfully');

    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected');
    });
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    process.exit(1);
  }
};

export default connectDB;
```

### 2.2 File .env

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/ai-learning
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d
NODE_ENV=development
```

### 2.3 User Model (src/models/user.model.ts)

```typescript
import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUserDocument extends Document {
  email: string;
  passwordHash: string;
  profile: {
    name: string;
    avatarUrl?: string;
    grade?: string;
  };
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema = new Schema<IUserDocument>(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
    },
    profile: {
      name: { type: String, required: true, trim: true },
      avatarUrl: { type: String, default: null },
      grade: { type: String, default: null },
    },
  },
  { timestamps: true }
);

// Index for faster queries
UserSchema.index({ email: 1 }, { unique: true });

// Method to compare password
UserSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

// Static method to hash password
export const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(password, salt);
};

export const User = mongoose.model<IUserDocument>('User', UserSchema);
```

---

## 3. Xây Dựng API Đăng Ký / Đăng Nhập

### 3.1 Auth Service (src/services/auth.service.ts)

```typescript
import jwt from 'jsonwebtoken';
import { User, hashPassword } from '../models/user.model';

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export class AuthService {
  /**
   * Register a new user
   */
  async register(userData: { email: string; password: string; name: string; grade?: string }) {
    const { email, password, name, grade } = userData;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new Error('Email already registered');
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const user = await User.create({
      email,
      passwordHash,
      profile: { name, grade },
    });

    // Generate token
    const token = jwt.sign(
      { userId: user._id.toString(), email: user.email },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
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
  async login(email: string, password: string) {
    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      throw new Error('Invalid email or password');
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new Error('Invalid email or password');
    }

    // Generate token
    const token = jwt.sign(
      { userId: user._id.toString(), email: user.email },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
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
   * Verify JWT token
   */
  verifyToken(token: string) {
    return jwt.verify(token, JWT_SECRET) as { userId: string; email: string };
  }
}

export const authService = new AuthService();
```

### 3.2 Auth Routes (src/routes/auth.routes.ts)

```typescript
import { Router } from 'express';
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

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post('/register', async (req, res) => {
  try {
    const validation = registerSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: validation.error.errors,
      });
      return;
    }

    const result = await authService.register(validation.data);

    res.status(201).json({
      success: true,
      data: result,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Registration failed';
    res.status(400).json({ success: false, message });
  }
});

/**
 * POST /api/auth/login
 * Login user
 */
router.post('/login', async (req, res) => {
  try {
    const validation = loginSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: validation.error.errors,
      });
      return;
    }

    const { email, password } = validation.data;
    const result = await authService.login(email, password);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Login failed';
    res.status(401).json({ success: false, message });
  }
});

/**
 * GET /api/auth/me
 * Get current user (protected route)
 */
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await authService.getCurrentUser(req.user!.userId);
    res.json({
      success: true,
      data: {
        id: user._id,
        email: user.email,
        profile: user.profile,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get user';
    res.status(400).json({ success: false, message });
  }
});

export default router;
```

### 3.3 Auth Middleware (src/middleware/auth.middleware.ts)

```typescript
import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';

// Extend Express Request interface
declare global {
  namespace Express {
    interface Request {
      user?: { userId: string; email: string };
    }
  }
}

export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.',
      });
      return;
    }

    const token = authHeader.split(' ')[1];
    const decoded = authService.verifyToken(token);
    req.user = decoded;

    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Invalid token',
    });
  }
};
```

---

## 4. Test Bằng Postman

### 4.1 Khởi động server

```bash
cd backend
npm run dev
```

Server sẽ chạy tại: `http://localhost:5000`

### 4.2 API Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/health` | Health check | No |
| POST | `/api/auth/register` | Register new user | No |
| POST | `/api/auth/login` | Login user | No |
| GET | `/api/auth/me` | Get current user | Yes |

### 4.3 Postman Collection

#### 1. Health Check

```http
GET http://localhost:5000/api/health
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2024-03-07T10:30:00.000Z",
  "environment": "development"
}
```

---

#### 2. Register User

```http
POST http://localhost:5000/api/auth/register
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "password123",
  "name": "Test User",
  "grade": "10"
}
```

**Expected Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "65e8a1b2c3d4e5f6a7b8c9d0",
      "email": "test@example.com",
      "name": "Test User"
    }
  }
}
```

**Error Response (400 Bad Request):**
```json
{
  "success": false,
  "message": "Email already registered"
}
```

---

#### 3. Login User

```http
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "password123"
}
```

**Expected Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "65e8a1b2c3d4e5f6a7b8c9d0",
      "email": "test@example.com",
      "name": "Test User"
    }
  }
}
```

**Error Response (401 Unauthorized):**
```json
{
  "success": false,
  "message": "Invalid email or password"
}
```

---

#### 4. Get Current User (Protected)

```http
GET http://localhost:5000/api/auth/me
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Expected Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "65e8a1b2c3d4e5f6a7b8c9d0",
    "email": "test@example.com",
    "profile": {
      "name": "Test User",
      "avatarUrl": null,
      "grade": "10"
    }
  }
}
```

**Error Response (401 Unauthorized):**
```json
{
  "success": false,
  "message": "Access denied. No token provided."
}
```

---

### 4.4 Postman Test Scripts

#### Test Script cho Register/Login

```javascript
// Parse response
const jsonData = pm.response.json();

// Save token to environment
if (jsonData.success && jsonData.data.token) {
    pm.environment.set("auth_token", jsonData.data.token);
    pm.environment.set("user_id", jsonData.data.user.id);
}

// Tests
pm.test("Status code is 200 or 201", function () {
    pm.expect(pm.response.code).to.be.oneOf([200, 201]);
});

pm.test("Response has success true", function () {
    pm.expect(jsonData.success).to.be.true;
});

pm.test("Response has token", function () {
    pm.expect(jsonData.data.token).to.exist;
});

pm.test("Response has user data", function () {
    pm.expect(jsonData.data.user).to.exist;
    pm.expect(jsonData.data.user.email).to.exist;
});
```

#### Test Script cho Protected Routes

```javascript
// Parse response
const jsonData = pm.response.json();

// Tests
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Response has user data", function () {
    pm.expect(jsonData.data).to.exist;
    pm.expect(jsonData.data.email).to.exist;
});
```

---

### 4.5 Environment Variables trong Postman

Tạo Environment mới với các variables:

| Variable | Initial Value | Current Value |
|----------|---------------|---------------|
| base_url | http://localhost:5000 | http://localhost:5000 |
| auth_token | | (để trống - tự động fill) |
| user_id | | (để trống - tự động fill) |

---

## 5. Yêu Cầu Hệ Thống

### 5.1 Prerequisites

- **Node.js**: v18.x hoặc cao hơn
- **MongoDB**: v6.x hoặc cao hơn
  - Local: Cài đặt MongoDB Community Server
  - Cloud: MongoDB Atlas (free tier)

### 5.2 Cài đặt MongoDB Local (Windows)

```powershell
# Download và cài đặt từ: https://www.mongodb.com/try/download/community
# Hoặc dùng chocolatey
choco install mongodb

# Khởi động MongoDB service
net start MongoDB
```

### 5.3 Cài đặt MongoDB Atlas (Cloud)

1. Truy cập: https://www.mongodb.com/atlas
2. Tạo account miễn phí
3. Create new cluster (M0 Sandbox - Free)
4. Database Access → Create user
5. Network Access → Allow from anywhere (0.0.0.0/0)
6. Connect → Drivers → Node.js → Copy connection string

```env
# Cập nhật .env với MongoDB Atlas URI
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/ai-learning?retryWrites=true&w=majority
```

---

## 6. Checklist Hoàn Thành

- [x] Khởi tạo Express server với TypeScript
- [x] Cấu hình MongoDB connection
- [x] Tạo User model với Mongoose
- [x] Xây dựng API đăng ký (/api/auth/register)
- [x] Xây dựng API đăng nhập (/api/auth/login)
- [x] Xây dựng middleware xác thực JWT
- [x] Xây dựng API lấy thông tin user (/api/auth/me)
- [x] Validation với Zod
- [x] Hash password với bcryptjs
- [x] Test API với Postman

---

## 7. Lệnh Chạy Dự Án

```bash
# Development mode (auto-reload)
npm run dev

# Build
npm run build

# Production
npm start
```

---

**Ngày báo cáo:** 07/03/2026

**Người thực hiện:** Trần Đỗ Lan Phương

**MSV:** B23DCCN667
