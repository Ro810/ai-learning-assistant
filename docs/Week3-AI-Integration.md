# Week 3: AI Integration

## Overview

Tích hợp Claude API vào hệ thống để sinh câu hỏi trắc nghiệm và tạo lộ trình học tập cá nhân hóa.

## Cấu hình

```env
# .env
ANTHROPIC_API_KEY=sk-ant-api03-xxx
ANTHROPIC_MODEL=claude-sonnet-4-20250514
```

## Files Created

```
backend/src/
├── types/
│   └── ai.types.ts           # AI types & interfaces
├── services/
│   ├── claude.service.ts     # Claude API integration
│   ├── ai.service.ts         # AI factory
│   ├── question-generator.service.ts    # Question generation
│   └── learning-path-generator.service.ts # Learning path generation
├── controllers/
│   ├── question.controller.ts
│   └── learning-path.controller.ts
├── routes/
│   ├── question.routes.ts
│   └── learning-path.routes.ts
```

## 1. AI Service

### Claude Service
```typescript
// src/services/claude.service.ts
export class ClaudeService implements IAIProvider {
  async generateContent(prompt: string): Promise<string> {
    const response = await this.client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
    });
    return response.content[0].text;
  }
}
```

## 2. Sinh câu hỏi trắc nghiệm

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/questions/generate` | Generate AI questions |
| GET | `/api/questions` | List questions |
| GET | `/api/questions/:id` | Get question |
| DELETE | `/api/questions/:id` | Delete question |

### Request
```json
{
  "topicIds": ["507f1f77bcf86cd799439012"],
  "difficulty": 2,
  "count": 5,
  "questionType": "multiple_choice"
}
```

### Prompt Template
```typescript
const prompt = `Sinh ${count} câu hỏi ${type} về ${topic}.
Độ khó: ${difficultyLabel}
Yêu cầu: 4 đáp án, 1 đáp án đúng, giải thích chi tiết.
Format JSON:`;
```

## 3. Tạo lộ trình học

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/learning-paths` | Create learning path |
| GET | `/api/learning-paths` | List paths |
| GET | `/api/learning-paths/:id` | Get path |
| PUT | `/api/learning-paths/:id` | Update progress |
| DELETE | `/api/learning-paths/:id` | Delete path |

### Request
```json
{
  "subjectId": "507f1f77bcf86cd799439011",
  "assessmentId": "507f1f77bcf86cd799439010",
  "targetDate": "2026-04-15",
  "targetLevel": "intermediate"
}
```

### Prompt Template
```typescript
const prompt = `Tạo lộ trình học từ ${currentLevel} đến ${targetLevel}.
Điểm mạnh: ${strengths}
Điểm yếu: ${weaknesses}
Thời gian: ${weeklyHours} giờ/tuần
Format JSON với milestones theo tuần:`;
```

## Flow

```
User Request → Controller → Service → Claude API
                                    ↓
                              Parse JSON
                                    ↓
                              Save to MongoDB
                                    ↓
                              Return Response
```

---

**Ngày:** 15/03/2026

**Sinh viên:** Trần Đỗ Lan Phương

**MSV:** B23DCCN667
