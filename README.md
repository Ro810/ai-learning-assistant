# 🎓 AI Learning Assistant

Web hỗ trợ học tập **cá nhân hóa bằng AI**: sinh đề kiểm tra đầu vào, tạo lộ trình học theo ngày, luyện tập thích ứng theo chủ đề/độ khó, phân tích điểm yếu và đề xuất nội dung ôn tập tiếp theo — sử dụng Google Gemini.

---

## ✨ Tính năng chính

### Tài khoản & bảo mật
- Đăng ký / đăng nhập với **JWT 7 ngày**, mật khẩu băm **bcrypt cost 12**.
- Đổi mật khẩu, đổi email (yêu cầu xác minh mật khẩu).
- **Quên mật khẩu / đặt lại** qua token (hết hạn 30 phút). Chưa cấu hình SMTP → link reset hiển thị ở chế độ dev.

### Đánh giá đầu vào (Assessment)
- AI **sinh câu hỏi trắc nghiệm** theo chủ đề (người dùng chỉ chọn số câu; độ khó hệ thống mặc định Trung bình).
- **Đề THPT** (Toán / Tiếng Anh) dùng ngân hàng câu hỏi pre-seed theo *test pack*.
- **Đếm ngược thời gian**: 15 giây/câu (Python, Tiếng Anh giao tiếp) tự chuyển câu; tính giờ cả đề (Toán 90′, Anh THPT 60′) tự nộp khi hết giờ.
- Chấm tự động, **phân tích kỹ năng theo từng chủ đề**, đề xuất trình độ phù hợp.
- Câu bỏ trống hiển thị "Chưa làm"; **gợi ý luyện tập cải thiện** khi điểm < 50%.

### Lộ trình học (Learning Path)
- AI tạo kế hoạch **chia theo NGÀY** (nhãn "Ngày X–Y"), mỗi chủ đề = 1 chặng.
- Mục **"Việc tuần này"** + cảnh báo **chặng trễ lịch**.
- Hiển thị **điểm chặng đã làm** và cho **làm lại**.

### Luyện tập (Practice)
- **Adaptive**: 2 câu đúng liên tiếp tăng độ khó, 2 câu sai giảm; *bank-first* tái dùng câu đã sinh để tiết kiệm quota.
- **Ôn lại câu sai theo từng môn**.
- Thống kê thời gian trung bình mỗi câu.

### Phân tích & nhắc nhở
- **Điểm yếu** (chủ đề < 50%) nhóm theo môn.
- **Chuông thông báo in-app** nhắc chặng đến hạn / trễ lịch.
- **Chuỗi ngày học (streak)** với mascot ngọn lửa động.

### Nội dung & tương tác AI
- Render **code/markdown + syntax highlighting** trong câu hỏi.
- **Đánh giá chất lượng nội dung Gemini** (👍/👎 + báo lỗi) cho câu hỏi và lộ trình.
- **Hỏi AI – "Giải thích thêm"**: chat nhiều lượt về một câu hỏi.
- **Ghi chú theo chủ đề** và **bookmark câu hỏi** (trang "Đã lưu").

### Giao diện & hệ thống
- **Dark mode** (bật/tắt, lưu localStorage), responsive (Next.js App Router).
- **Xoay vòng nhiều Gemini API key** khi hết quota, xử lý lỗi 429/quá tải thân thiện.
- **Single in-progress guard**: mỗi user chỉ 1 bài/phiên đang dở cùng môn.
- Tài liệu API **Swagger** tại `/api-docs`.

---

## 🧱 Tech Stack

| Layer | Công nghệ |
|---|---|
| Frontend | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, Radix UI, framer-motion, lucide-react, sonner, axios |
| Backend | Node.js, Express 4, TypeScript, Mongoose 8, Zod, JWT, bcryptjs |
| Database | MongoDB (local hoặc Atlas) |
| AI | Google Gemini / Gemma (`@google/genai`) |
| Docs | Swagger (swagger-jsdoc + swagger-ui-express) |

**Kiến trúc:**

```
Frontend (Next.js) ──REST API──► Backend (Express) ──► MongoDB
                                       │
                                       └─► Google Gemini API
```

Backend tách qua interface `IAIProvider` (Gemini thật / mock) nên dễ thay nhà cung cấp AI.

---

## 📁 Cấu trúc thư mục

```
ai-learning-assistant/
├── backend/                         # Express + TypeScript API
│   └── src/
│       ├── config/                  # database, swagger
│       ├── controllers/             # ai, assessment, practice-session, learning-path,
│       │                            # question, subject, user, pack, feedback, note, bookmark
│       ├── middleware/              # auth (JWT)
│       ├── models/                  # user, subject, question, assessment, practice-session,
│       │                            # learning-path, test-pack, content-feedback, note, bookmark
│       ├── routes/                  # định tuyến tương ứng controllers
│       ├── services/                # gemini, key-pool, generators, graders, selectors
│       ├── scripts/                 # seed subjects + THPT packs
│       ├── app.ts                   # khởi tạo Express + mount routes
│       └── server.ts                # entrypoint
│
├── frontend/                        # Next.js (App Router)
│   ├── public/                      # ảnh tĩnh
│   └── src/
│       ├── app/                     # routes: login, register, forgot/reset-password,
│       │                            # dashboard, subjects, assessment, practice,
│       │                            # learning-path, weakness, bookmarks, profile, ...
│       ├── components/              # UI tái sử dụng (header, theme-toggle, streak-card,
│       │                            # notification-bell, question-content, ask-ai-button,
│       │                            # feedback-buttons, bookmark-button, note-editor, ...)
│       └── lib/                     # api-client, api-services, types, helpers
│
└── README.md
```

---

## 🚀 Cài đặt & chạy

### Yêu cầu
- **Node.js** ≥ 18
- **MongoDB** (local hoặc Atlas) — bỏ qua nếu chạy mock auth
- **Gemini API key** miễn phí: https://aistudio.google.com/apikey

### 1) Backend

```bash
cd backend
npm install

# Tạo file .env từ mẫu rồi điền giá trị
cp .env.example .env        # Windows: copy .env.example .env

# Nạp dữ liệu môn học + đề THPT (chạy 1 lần)
npm run seed:subjects
npm run seed:math-thpt-packs
npm run seed:english-thpt-packs

# Chạy dev (tự reload)
npm run dev                 # http://localhost:5000  | docs: /api-docs
```

### 2) Frontend

```bash
cd frontend
npm install

# (Tùy chọn) trỏ API nếu backend không chạy ở localhost:5000
# echo "NEXT_PUBLIC_API_URL=http://localhost:5000/api" > .env.local

npm run dev                 # http://localhost:3000
```

### Build production

```bash
# Backend
cd backend && npm run build && npm start
# Frontend
cd frontend && npm run build && npm start
```

---

## ⚙️ Biến môi trường (backend `.env`)

| Biến | Mô tả |
|---|---|
| `PORT` | Cổng API (mặc định `5000`) |
| `MONGODB_URI` | Chuỗi kết nối MongoDB. Đặt `mock` để dùng bộ nhớ tạm (chỉ test auth) |
| `JWT_SECRET` | Khóa ký JWT (đổi khi production) |
| `JWT_EXPIRES_IN` | Hạn token (mặc định `7d`) |
| `NODE_ENV` | `development` / `production` |
| `GEMINI_API_KEYS` | Danh sách key Gemini, phân tách dấu phẩy (`key1,key2,...`) — ưu tiên, hỗ trợ xoay vòng |
| `GEMINI_API_KEY` | 1 key (dùng khi không đặt `GEMINI_API_KEYS`) |
| `GEMINI_MODEL` | Model (vd `gemini-2.5-flash`, `gemma-3-27b-it`) |
| `FRONTEND_URL` | Dùng dựng link đặt lại mật khẩu (mặc định `http://localhost:3000`) |

Frontend (tùy chọn) — `frontend/.env.local`: `NEXT_PUBLIC_API_URL` (mặc định `http://localhost:5000/api`).

---

## 📝 Ghi chú
- **Quên mật khẩu**: yêu cầu MongoDB thật (không hỗ trợ mock); chưa cấu hình email nên link reset được log ra console / trả về ở chế độ dev. Cắm SMTP để gửi email thật.
- **Email nhắc học**: hiện chỉ nhắc **in-app** (chuông); phần email để mở rộng sau.
- Hết quota Gemini: hệ thống tự xoay key kế tiếp và báo lỗi 429 thân thiện.

---

## 👤 Tác giả

**Trần Đỗ Lan Phương** - **B23CN667**.

