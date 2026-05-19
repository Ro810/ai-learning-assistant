# 🎓 AI Learning Assistant

Web hỗ trợ học tập cá nhân hóa: AI sinh đề kiểm tra đầu vào, tạo lộ trình học, sinh câu hỏi luyện tập theo chủ đề và độ khó, phân tích điểm yếu và đề xuất nội dung ôn tập tiếp theo.

## Tính năng chính

- **Đăng ký / đăng nhập** với JWT 7 ngày, đổi mật khẩu/email an toàn (bcrypt cost 12).
- **Đánh giá đầu vào (assessment)** — AI sinh câu hỏi trắc nghiệm theo chủ đề và độ khó, chấm tự động, phân tích kỹ năng theo từng topic, đề xuất trình độ phù hợp.
- **Lộ trình học (learning path)** — AI tạo kế hoạch theo tuần dựa trên kết quả đánh giá, mục tiêu và thời gian học mỗi tuần.
- **Phiên luyện tập (practice session)** — Adaptive: 2 câu đúng liên tiếp tăng độ khó, 2 câu sai giảm. Bank-first: tái sử dụng câu hỏi đã sinh trước đó để giảm chi phí AI.
- **Phân tích điểm yếu** — Topic có tỉ lệ đúng < 50% được lưu vào `weakTopics` của user và đề xuất luyện tập thêm.
- **Single in-progress guard** — Mỗi user chỉ có 1 bài đang dở/môn (hoặc 1 phiên luyện tập toàn cục), tránh confusion UX.

## Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, shadcn/ui, sonner, axios |
| Backend | Express 4, TypeScript, Mongoose ODM, Zod validation |
| Database | MongoDB (local hoặc Atlas) |
| AI provider | Google Gemini / Gemma (free tier, không cần thẻ tín dụng) |
| Auth | JWT + bcryptjs |

Kiến trúc:
```
Frontend ──REST API──► Backend ──► MongoDB
                          │
                          └─► Gemini API
```

Backend dùng interface `IAIProvider` nên dễ thay nhà cung cấp AI sau này (chỉ cần viết 1 service mới implement cùng interface).

## Cấu trúc thư mục

```
ai-learning-assistant/
├── backend/                       # Express + TypeScript
│   ├── src/
│   │   ├── config/                # database, mongoose, swagger
│   │   ├── controllers/           # 6 controller (assessment, practice, ...)
│   │   ├── middleware/            # JWT auth
│   │   ├── models/                # 6 Mongoose schema
│   │   ├── routes/                # 7 router file (35 endpoint)
│   │   ├── scripts/               # seed-subjects
│   │   ├── services/              # AI provider + business logic
│   │   ├── types/                 # TS interface
│   │   ├── app.ts                 # Express setup
│   │   └── server.ts              # Entry point
│   └── .env.example
│
├── frontend/                      # Next.js + TypeScript
│   ├── src/
│   │   ├── app/                   # login, register, dashboard, assessment/...
│   │   ├── components/            # app-header, protected-route, ui/
│   │   └── lib/                   # api-client, api-services, auth-context, types
│   └── package.json
│
├── docs/
│   ├── pdf/                       # Báo cáo PDF từng tuần (nộp giảng viên)
│   └── build-pdf.sh               # Script regenerate PDF từ markdown
│
├── playground-1.mongodb.js        # Query mẫu xem DB
└── README.md
```

## Yêu cầu

- Node.js ≥ 20
- MongoDB local (`winget install MongoDB.Server`) hoặc account Atlas
- Google Gemini API key (free tier): https://aistudio.google.com/apikey

## Cài đặt & chạy

### Backend

```bash
cd backend
npm install
cp .env.example .env       # rồi sửa MONGODB_URI + GEMINI_API_KEY
npm run seed:subjects      # seed 4 môn mặc định
npm run dev                # http://localhost:5000
```

Swagger UI tại http://localhost:5000/api-docs.

Chạy không cần MongoDB (chỉ test auth): `MONGODB_URI=mock npm run dev`.

### Frontend

```bash
cd frontend
npm install
npm run dev                # http://localhost:3000
```

Mặc định gọi `http://localhost:5000/api`. Đổi qua `frontend/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

### Smoke test

1. Đăng ký tài khoản tại http://localhost:3000
2. Dashboard → chọn môn → "Bắt đầu" → AI sinh câu hỏi (~10-30s)
3. Trả lời → "Nộp bài" → xem điểm + phân tích kỹ năng + review từng câu
4. Bài hiện trên Dashboard kèm điểm và trình độ đề xuất
5. (Tiếng Anh THPT) Dashboard → "Tiếng Anh THPT" → chọn 1 trong 10 đề → chọn phần thi → làm ngay (không cần AI)

## Database

4 môn mặc định sau khi `npm run seed:subjects`:
- Toán THPT (5 chủ đề)
- Tiếng Anh THPT (6 phần thi — có cấu trúc đề pre-seed, xem dưới)
- Lập trình Python (4 chủ đề)
- Tiếng Anh giao tiếp (4 chủ đề)

7 collection chính: `users`, `subjects`, `questions`, `assessments`, `learningpaths`, `practicesessions`, `testpacks`.

### Tiếng Anh THPT — cấu trúc đề thi
Môn `english-thpt` hoạt động khác các môn còn lại: thay vì AI sinh câu mỗi lần, có 10 đề pre-seed (Đề 1 → Đề 10), mỗi đề 40 câu MCQ chia theo 6 phần (Ngữ âm, Ngữ pháp, Từ vựng, Đọc hiểu, Tìm lỗi sai, Viết lại câu). Seed thêm bằng:

```bash
cd backend
npm run seed:english-thpt-packs   # cần chạy sau seed:subjects
```

Trên UI: dashboard → Tiếng Anh THPT → danh sách 10 đề → chọn 1 đề → chọn 1 phần thi → làm bài.

Xem dữ liệu nhanh bằng VSCode MongoDB extension + file [playground-1.mongodb.js](playground-1.mongodb.js).

## Hướng phát triển tiếp

- Practice UI + Profile page + Learning Path detail
- Biểu đồ điểm yếu (chart)
- Server-side auth middleware (Next.js)
- Docker compose deployment
- Mobile app (React Native)

## Tác giả

- Trần Đỗ Lan Phương — MSV B23DCCN667
- GVHD: TS. Nguyễn Xuân Đức
- Repo: https://github.com/Ro810/ai-learning-assistant
