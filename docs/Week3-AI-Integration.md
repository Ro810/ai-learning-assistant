# BÁO CÁO TUẦN 3 — Tích hợp AI sinh câu hỏi và lộ trình học

| | |
|---|---|
| **Đề tài** | AI Learning Assistant — Web hỗ trợ học tập cá nhân hóa |
| **Sinh viên** | Trần Đỗ Lan Phương |
| **MSV** | B23DCCN667 |
| **Giảng viên hướng dẫn** | TS. Nguyễn Xuân Đức |
| **Tuần** | 3 |


---

## 1. Mục tiêu tuần

- Tích hợp Claude API vào hệ thống backend.
- Cài đặt service sinh câu hỏi trắc nghiệm tự động theo chủ đề và độ khó.
- Cài đặt service sinh lộ trình học cá nhân hóa dựa trên kết quả đánh giá.
- Tăng cường validate input bằng Zod ở mọi endpoint mới.

---

## 2. Công việc đã thực hiện

### 2.1 Cấu hình AI

```env
# .env
ANTHROPIC_API_KEY=sk-ant-api03-xxx
ANTHROPIC_MODEL=claude-sonnet-4-20250514
```

Cài đặt Anthropic SDK qua interface `IAIProvider` để dễ thay thế nếu cần đổi nhà cung cấp.

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

### 2.2 Sinh câu hỏi trắc nghiệm

| Method | Endpoint | Mô tả |
|---|---|---|
| POST | `/api/questions/generate` | Sinh N câu hỏi qua AI |
| GET | `/api/questions` | Liệt kê câu hỏi (filter topic, độ khó) |
| GET | `/api/questions/:id` | Chi tiết một câu hỏi |
| DELETE | `/api/questions/:id` | Xóa câu hỏi |

Request mẫu:
```json
{
  "topicIds": ["507f1f77bcf86cd799439012"],
  "difficulty": 2,
  "count": 5,
  "questionType": "multiple_choice"
}
```

Prompt template (rút gọn):
```
Sinh ${count} câu hỏi về chủ đề: ${topic}.
Độ khó: ${difficultyLabel}.
Yêu cầu: 4 đáp án, 1 đáp án đúng, giải thích chi tiết.
Format JSON: [...]
```

Câu hỏi sinh ra được parse JSON và lưu vào collection `questions` để tái sử dụng ở các phiên luyện tập sau (giảm chi phí AI).

### 2.3 Sinh lộ trình học cá nhân hóa

| Method | Endpoint | Mô tả |
|---|---|---|
| POST | `/api/learning-paths` | Tạo lộ trình từ kết quả assessment |
| GET | `/api/learning-paths` | Liệt kê lộ trình của user |
| GET | `/api/learning-paths/:id` | Chi tiết một lộ trình |
| PUT | `/api/learning-paths/:id` | Cập nhật tiến độ milestone |
| DELETE | `/api/learning-paths/:id` | Xóa lộ trình |

Request mẫu:
```json
{
  "subjectId": "...",
  "assessmentId": "...",
  "targetDate": "2026-08-15",
  "targetLevel": "intermediate",
  "weeklyStudyHours": 10
}
```

Service đọc `assessment.results.skillAnalysis` để xác định:
- **Strengths:** topic có tỉ lệ đúng > 70%.
- **Weaknesses:** topic có tỉ lệ đúng < 50%.
- **Current level:** lấy từ `recommendedLevel` của bài assessment.

Prompt yêu cầu AI trả JSON với `milestones` chia theo tuần, mỗi milestone gắn với topic cụ thể và tài nguyên gợi ý.

### 2.4 Luồng xử lý chung

```
User Request → Controller (Zod validate) → Service → Claude API
                                                ↓
                                          Parse JSON
                                                ↓
                                          Save MongoDB
                                                ↓
                                          Return Response
```

### 2.5 Củng cố Zod validation
Kiểm tra lại toàn bộ endpoint của Tuần 2 + Tuần 3, đảm bảo mọi body đều qua schema Zod, trả về thông báo lỗi rõ ràng cho client.

---

## 3. Kết quả đạt được

- 9 endpoint mới hoạt động (4 questions + 5 learning paths).
- AI sinh câu hỏi và lộ trình ổn định cho 4 chủ đề thử nghiệm (Toán, IELTS, Python, Tiếng Anh giao tiếp).
- Tổng số endpoint backend tăng từ 4 → 13.
- Swagger UI tự động cập nhật JSDoc cho các endpoint mới.

---

## 4. Khó khăn / Vấn đề gặp phải

- **AI trả JSON không sạch:** Đôi khi Claude trả thêm chữ giải thích trước/sau JSON khiến `JSON.parse` lỗi. Đã xử lý bằng regex `match(/\[[\s\S]*\]/)` để trích xuất phần JSON khỏi response.
- **Topic ID không có ngữ cảnh:** Prompt ban đầu chứa `ObjectId` chuỗi → AI sinh câu hỏi không liên quan. Đã thêm bước `resolveTopicNames` để tra ngược tên topic từ Subject collection trước khi đưa vào prompt.
- **Chi phí AI:** Mỗi assessment tốn ~$0.01 cho 10 câu hỏi. Quyết định lưu câu hỏi vào DB và tái sử dụng ở các phiên luyện tập (đã chuẩn bị nền tảng cho cơ chế bank-first ở Tuần 4).

---

## 5. Hướng tuần tiếp theo

- Hoàn tất các nhóm endpoint còn lại: Subject catalog, Assessment, Practice Session, User Profile.
- Cài đặt cơ chế chống "bài đang dở" (single in-progress) cho assessment và practice.
- Thêm chức năng đổi mật khẩu và đổi email.
- Tổng hợp tài liệu API tổng kết toàn bộ backend cho frontend Tuần 5 sử dụng.
