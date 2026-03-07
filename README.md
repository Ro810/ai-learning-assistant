# 🎓 AI Learning Assistant
Web Hỗ Trợ Học Tập Cá Nhân Hóa

## 📌 1. Giới thiệu
AI Learning Assistant là một nền tảng web ứng dụng trí tuệ nhân tạo (AI) nhằm cá nhân hóa quá trình học tập dựa trên:
- Trình độ hiện tại của người dùng
- Mục tiêu học tập
- Kết quả luyện tập theo thời gian

Hệ thống giúp người học:
- Xác định điểm mạnh – điểm yếu
- Nhận lộ trình học phù hợp
- Luyện tập với câu hỏi được sinh tự động
- Theo dõi tiến độ cải thiện

Dự án hướng tới việc hỗ trợ học sinh, sinh viên và người tự học nâng cao hiệu quả học tập trong thời gian ngắn hơn.

## 🎯 2. Mục tiêu dự án
- Cá nhân hóa quá trình học thay vì học theo chương trình chung
- Ứng dụng AI để tự động đánh giá và điều chỉnh nội dung học
- Tối ưu thời gian ôn tập
- Tăng khả năng ghi nhớ và cải thiện kết quả học tập
- Xây dựng nền tảng có khả năng mở rộng thành sản phẩm thực tế

## 👥 3. Đối tượng sử dụng
- Học sinh ôn thi THPT
- Người luyện thi IELTS
- Sinh viên học lập trình
- Người học tiếng Anh giao tiếp
- Người tự học cần lộ trình rõ ràng

## 🚀 4. Tính năng chính
### 4.1 Đánh giá trình độ tự động
- Sinh bài test đầu vào theo chủ đề
- Chấm điểm tự động
- Phân tích theo kỹ năng / chuyên đề
- Xác định mức độ: Cơ bản – Trung bình – Nâng cao

### 4.2 Tạo lộ trình học cá nhân hóa
Hệ thống xây dựng kế hoạch học dựa trên:
- Mục tiêu (IELTS 6.5, đỗ đại học, học Python cơ bản…)
- Thời gian còn lại
- Trình độ hiện tại

Kết quả:
- Phân chia nội dung theo tuần / ngày
- Đề xuất nội dung cần tập trung
- Gợi ý tài nguyên học phù hợp

### 4.3 Sinh câu hỏi trắc nghiệm bằng AI
- Tự động tạo câu hỏi theo chủ đề
- Điều chỉnh độ khó theo năng lực
- Cung cấp đáp án và lời giải thích
- Tạo đề luyện tập mô phỏng

### 4.4 Phân tích điểm yếu
- Theo dõi kết quả từng bài làm
- Xác định chủ đề sai nhiều
- Đề xuất nội dung cần ôn tập lại
- Gợi ý bài luyện tập bổ sung

### 4.5 Gợi ý tài liệu học
Hệ thống đề xuất tài nguyên dựa trên:
- Trình độ người dùng
- Chủ đề đang yếu
- Mục tiêu học tập

Tài nguyên có thể bao gồm:
- Video học tập
- Bài viết
- Tài liệu PDF
- Bài tập thực hành

## 🧠 5. AI tích hợp trong hệ thống
Hệ thống AI được sử dụng để:
- Sinh bài test đánh giá trình độ
- Tạo câu hỏi luyện tập
- Phân tích dữ liệu học tập
- Tạo lộ trình học thông minh
- Gợi ý tài nguyên phù hợp

Mở rộng trong tương lai:
- Chatbot giải bài theo ngữ cảnh
- Adaptive Learning (điều chỉnh độ khó theo thời gian thực)

## 📊 6. Ứng dụng thực tế
### 📚 Ôn thi THPT
- Luyện đề theo chuyên đề
- Phân tích lỗi sai
- Tập trung vào phần mất điểm nhiều

### 🇬🇧 Luyện thi IELTS
- Sinh đề Reading / Listening
- Gợi ý từ vựng theo band điểm
- Phân tích kỹ năng yếu

### 💻 Học lập trình
- Tạo bài tập thực hành
- Phân tích lỗi code
- Đề xuất chủ đề tiếp theo

### 🗣 Học tiếng Anh giao tiếp
- Sinh hội thoại theo tình huống
- Phản hồi ngữ pháp
- Gợi ý cách diễn đạt tự nhiên hơn

## 🏗 7. Kiến trúc hệ thống
```
Frontend (Next.js + TypeScript + Tailwind)
       ↓ REST API
Backend (Express + TypeScript + Mongoose)
       ↓ HTTP
AI Service (Claude/GPT API)
       ↓
MongoDB Database
```

**Stack chi tiết:**
| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15, React 19, TypeScript, Tailwind CSS v4, shadcn/ui |
| Backend | Express.js, TypeScript, Mongoose ODM |
| Database | MongoDB |
| AI | Claude API / OpenAI GPT |
| Auth | JWT (jsonwebtoken) + bcryptjs |
| Validation | Zod |

**Luồng xử lý chính:**
**Luồng xử lý chính:**
Người dùng → Làm bài test → Backend gọi AI → Lưu kết quả → Phân tích → Tạo lộ trình học

## 📂 8. Cấu trúc dự án
```
ai-learning-assistant/
├── backend/                  # Express + TypeScript + MongoDB
│   ├── src/
│   │   ├── config/
│   │   │   └── database.ts          # MongoDB connection
│   │   ├── middleware/
│   │   │   └── auth.middleware.ts   # JWT auth
│   │   ├── models/
│   │   │   ├── user.model.ts        # User schema
│   │   │   ├── subject.model.ts     # Subject + topics
│   │   │   ├── question.model.ts    # AI questions
│   │   │   ├── assessment.model.ts  # Entry tests
│   │   │   ├── learning-path.model.ts
│   │   │   ├── practice-session.model.ts
│   │   │   └── index.ts
│   │   ├── routes/
│   │   │   └── auth.routes.ts       # Auth API
│   │   ├── services/
│   │   │   └── auth.service.ts      # Auth logic
│   │   ├── types/
│   │   │   └── index.ts             # TS interfaces
│   │   ├── app.ts                   # Express setup
│   │   └── server.ts                # Entry point
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
│
├── frontend/                 # Giao diện người dùng (Next.js)
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   ├── services/
│   │   └── ...
│
├── docs/                     # Tài liệu & báo cáo tiến độ
│   ├── Week1-Requirement-Analysis.md
│   ├── Week2-Backend-Setup.md
│   ├── Week3-AI-Integration.md
│   ├── Week4-API-Completion.md
│   ├── Week5-Frontend-Basic.md
│   ├── Week6-Dashboard.md
│   ├── Week7-Optimization.md
│   └── Week8-Deployment-Report.md
│
└── README.md
```

## ⚙️ 9. Cài đặt & Chạy dự án
1️⃣ **Clone project**
```bash
git clone https://github.com/Ro810/ai-learning-assistant.git
cd ai-learning-assistant
```
2️⃣ **Cài đặt Backend**
```bash
cd backend
npm install
npm start
```
3️⃣ **Cài đặt Frontend (Next.js)**
```bash
cd frontend
npm install
npm run dev
```

## 🔮 10. Hướng phát triển tương lai
- 🤖 Chatbot giải bài theo môn học
- 📈 Dashboard phân tích nâng cao
- 🏆 Gamification (điểm thưởng, huy hiệu)
- 📱 Ứng dụng mobile
- 🧑‍🏫 Hệ thống giáo viên theo dõi học sinh
- 🧠 Adaptive Learning nâng cao

## 🌟 11. Điểm nổi bật của dự án
- Cá nhân hóa hoàn toàn lộ trình học
- AI sinh nội dung tự động
- Phân tích dữ liệu học tập thông minh
- Ứng dụng thực tế cao
- Có tiềm năng thương mại hóa

---
## 👨‍💻 Tác Giả

**Sinh viên thực hiện:**

- **Họ và tên:** Trần Đỗ Lan Phương
- **MSV:** B23DCCN667
- **Giảng viên hướng dẫn:** Nguyễn Xuân Đức

