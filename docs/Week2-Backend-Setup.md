# BÁO CÁO TUẦN 2 — Khởi tạo backend & xác thực người dùng

| | |
|---|---|
| **Đề tài** | AI Learning Assistant — Web hỗ trợ học tập cá nhân hóa |
| **Sinh viên** | Trần Đỗ Lan Phương |
| **MSV** | B23DCCN667 |
| **Giảng viên hướng dẫn** | TS. Nguyễn Xuân Đức |
| **Tuần** | 2 |

---

## 1. Mục tiêu tuần

- Khởi tạo dự án backend với Express + TypeScript.
- Kết nối MongoDB qua Mongoose, thiết kế 6 schema chính.
- Cài đặt xác thực JWT (đăng ký / đăng nhập / lấy thông tin người dùng).
- Bổ sung Swagger UI để tài liệu hóa API.
- Thêm chế độ Mock Mode cho phép phát triển không cần MongoDB.

---

## 2. Công việc đã thực hiện

### 2.1 Cấu trúc dự án

```
backend/
├── src/
│   ├── app.ts              # Express app
│   ├── server.ts           # Entry point
│   ├── config/             # database, mongoose, swagger
│   ├── middleware/         # JWT auth middleware
│   ├── models/             # 6 Mongoose schemas
│   ├── routes/             # auth.routes.ts
│   ├── services/           # auth.service.ts
│   └── types/              # TS interfaces
├── package.json
└── .env.example
```

### 2.2 Mongoose Schemas

Cài đặt 6 schema theo thiết kế từ Tuần 1:
`user.model.ts`, `subject.model.ts`, `question.model.ts`, `assessment.model.ts`, `learning-path.model.ts`, `practice-session.model.ts`.

User schema rút gọn:
```typescript
{
  email: string (unique),
  passwordHash: string (bcrypt),
  profile: { name, avatarUrl?, grade? },
  learningGoals: [{ subjectId, targetLevel, targetDate }],
  currentLevel: { subjectId, level, weakTopics: ObjectId[] }
}
```

### 2.3 JWT Authentication

| Method | Endpoint | Auth | Mô tả |
|---|---|---|---|
| POST | `/api/auth/register` | — | Đăng ký tài khoản mới |
| POST | `/api/auth/login` | — | Đăng nhập, trả về JWT |
| GET | `/api/auth/me` | ✓ | Lấy thông tin người dùng hiện tại |

- Mật khẩu băm bằng bcrypt (cost factor 12).
- JWT ký với secret + thời hạn 7 ngày (`JWT_EXPIRES_IN=7d`).
- Middleware `authMiddleware` đọc header `Authorization: Bearer <token>` và gắn `req.user`.

### 2.4 Validation
Dùng **Zod** để kiểm tra body request: email format, password ≥ 6 ký tự, name ≥ 2 ký tự. Trả về 400 với danh sách lỗi cụ thể nếu sai.

### 2.5 Swagger Documentation
- Tích hợp `swagger-jsdoc` + `swagger-ui-express`.
- Truy cập: `http://localhost:5000/api-docs`.
- JSDoc gắn trực tiếp trên route file → tự động cập nhật khi thêm endpoint.

### 2.6 Mock Mode
Tính năng phụ giúp phát triển không cần MongoDB:
```bash
MONGODB_URI=mock npm run dev
```
- Lưu user trong `Map<email, User>` (in-memory).
- Hữu ích cho demo offline hoặc CI ban đầu.

---

## 3. Kết quả đạt được

- Backend chạy được ở cổng 5000 với 4 endpoint hoạt động (3 auth + 1 health check).
- Đăng ký → đăng nhập → lấy `me` thành công cả trên MongoDB thật và mock mode.
- Swagger UI render đầy đủ schema request/response.
- Code base có TypeScript strict, ESLint, build script (`npm run build`).

### Test request mẫu

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","name":"Test User"}'
```
Response 201 trả về `{ token, user: { id, email, name } }`.

---

## 4. Khó khăn / Vấn đề gặp phải

- **Mongoose buffering:** Khi `MONGODB_URI=mock`, mongoose mặc định buffer commands chờ connect → request treo. Đã xử lý bằng `mongoose.set('bufferCommands', false)` trong `mongoose-setup.ts` cho mock mode.
- **Thứ tự load env vars:** `dotenv.config()` phải chạy **trước** mọi import liên quan tới mongoose, nếu không `MONGODB_URI` sẽ undefined. Đã tách thành file `mongoose-setup.ts` được import đầu tiên trong `app.ts`.

---

## 5. Hướng tuần tiếp theo

- Tích hợp Claude API qua interface `IAIProvider`.
- Cài đặt 2 service AI: sinh câu hỏi trắc nghiệm và sinh lộ trình học.
- Thêm endpoint `/api/questions/generate` và `/api/learning-paths`.
- Viết prompt template tiếng Việt cho mỗi service.
