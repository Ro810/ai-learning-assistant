# Week 2: Backend Setup

## Overview

Express.js + MongoDB backend với JWT authentication, Swagger documentation, và Mock Mode support.

## Quick Start

```bash
cd backend
npm install
# Chạy với MongoDB thật
npm run dev
# Hoặc chạy không cần MongoDB (mock mode)
MONGODB_URI=mock npm run dev
```

## Project Structure

```
backend/
├── src/
│   ├── app.ts              # Express app setup
│   ├── server.ts           # Entry point
│   ├── config/
│   │   ├── database.ts     # MongoDB connection
│   │   ├── mongoose-setup.ts  # Env vars + mongoose config
│   │   └── swagger.ts     # Swagger config
│   ├── middleware/
│   │   └── auth.middleware.ts  # JWT verification
│   ├── models/
│   │   ├── user.model.ts       # User schema
│   │   ├── subject.model.ts    # Subject schema
│   │   ├── question.model.ts   # Question schema
│   │   ├── assessment.model.ts # Assessment schema
│   │   ├── learning-path.model.ts
│   │   └── practice-session.model.ts
│   ├── routes/
│   │   └── auth.routes.ts  # Auth endpoints
│   ├── services/
│   │   └── auth.service.ts    # Auth logic
│   └── types/
│       └── index.ts       # TypeScript interfaces
├── package.json
├── tsconfig.json
└── .env.example
```

## Environment Variables

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/ai-learning
# Hoặc dùng mock mode: MONGODB_URI=mock
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d
NODE_ENV=development
```

## API Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/health` | Health check | No |
| POST | `/api/auth/register` | Register new user | No |
| POST | `/api/auth/login` | Login user | No |
| GET | `/api/auth/me` | Get current user | Yes |

### Authentication

All protected routes require Bearer token:
```
Authorization: Bearer <token>
```

### Request/Response Examples

**Register**
```bash
POST /api/auth/register
{
  "email": "user@example.com",
  "password": "password123",
  "name": "Test User",
  "grade": "10"
}
```

**Response (201)**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGci...",
    "user": { "id": "...", "email": "...", "name": "..." }
  }
}
```

**Login**
```bash
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Get Current User** (protected)
```bash
GET /api/auth/me
Authorization: Bearer <token>
```

## Features

### Mock Mode
Chạy backend không cần MongoDB:
```bash
MONGODB_URI=mock npm run dev
```
Dữ liệu được lưu trong memory, restart server sẽ mất.

### Swagger Documentation
Truy cập: `http://localhost:5000/api-docs`

### Request Logging
Trong development mode, mỗi request được log ra console.

### Error Handling
- 404 cho routes không tồn tại
- 500 cho internal errors
- Validation errors với Zod

## User Model Schema

```typescript
{
  email: string (unique, required)
  passwordHash: string (required, bcrypt)
  profile: {
    name: string (required)
    avatarUrl?: string
    grade?: string
  }
  learningGoals?: [{
    subjectId: ObjectId
    targetLevel: 'basic' | 'intermediate' | 'advanced'
    targetDate: Date
  }]
  currentLevel?: {
    subjectId: ObjectId
    level: string
    weakTopics: ObjectId[]
  }
  createdAt: Date
  updatedAt: Date
}
```

## Available Scripts

```bash
npm run dev    # Development (auto-reload)
npm run build  # Build to dist/
npm start      # Production
npm run lint   # ESLint
```

## Dependencies

| Package | Purpose |
|---------|---------|
| express | Web framework |
| mongoose | MongoDB ODM |
| jsonwebtoken | JWT auth |
| bcryptjs | Password hashing |
| zod | Validation |
| swagger-ui-express | API docs |
| cors | Cross-origin |

---

**Ngày:** 08/03/2026

**Sinh viên:** Trần Đỗ Lan Phương

**MSV:** B23DCCN667
