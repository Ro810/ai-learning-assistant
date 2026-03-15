# Week 1: Requirement Analysis

## 1. Project Overview

**AI Learning Assistant** - Web app cá nhân hóa quá trình học tập bằng AI.

### Mục tiêu
- Cá nhân hóa lộ trình học
- AI sinh câu hỏi tự động
- Đánh giá trình độ tự động
- Theo dõi tiến độ cải thiện

### Đối tượng
- Học sinh ôn thi THPT
- Người luyện thi IELTS
- Sinh viên học lập trình

---

## 2. Functional Requirements

### 2.1 User Management
| ID | Requirement | Priority |
|----|-------------|----------|
| FR-001 | Đăng ký tài khoản | High |
| FR-002 | Đăng nhập/Đăng xuất | High |
| FR-003 | Cập nhật thông tin cá nhân | Medium |
| FR-004 | Thiết lập mục tiêu học tập | High |

### 2.2 Assessment
| ID | Requirement | Priority |
|----|-------------|----------|
| FR-005 | Sinh bài test đầu vào theo chủ đề | High |
| FR-006 | Chấm điểm tự động | High |
| FR-007 | Phân tích kết quả theo kỹ năng | High |
| FR-008 | Xác định mức độ (Basic/Intermediate/Advanced) | High |

### 2.3 Learning Path
| ID | Requirement | Priority |
|----|-------------|----------|
| FR-009 | Tạo lộ trình học dựa trên mục tiêu | High |
| FR-010 | Phân chia nội dung theo tuần/ngày | Medium |
| FR-011 | Đề xuất nội dung cần tập trung | High |
| FR-012 | Gợi ý tài nguyên học | Medium |

### 2.4 Practice
| ID | Requirement | Priority |
|----|-------------|----------|
| FR-013 | Sinh câu hỏi trắc nghiệm theo chủ đề | High |
| FR-014 | Điều chỉnh độ khó theo năng lực | High |
| FR-015 | Cung cấp đáp án và lời giải thích | High |
| FR-016 | Tạo đề luyện tập mô phỏng | Medium |

### 2.5 Analytics
| ID | Requirement | Priority |
|----|-------------|----------|
| FR-017 | Theo dõi kết quả từng bài làm | High |
| FR-018 | Xác định chủ đề sai nhiều | High |
| FR-019 | Đề xuất nội dung cần ôn tập | Medium |
| FR-020 | Hiển thị tiến độ cải thiện | Medium |

---

## 3. Non-Functional Requirements

### 3.1 Performance
| ID | Requirement | Target |
|----|-------------|--------|
| NFR-001 | API response time | < 2s |
| NFR-002 | AI question generation | < 5s |
| NFR-003 | Page load time | < 3s |

### 3.2 Security
| ID | Requirement |
|----|-------------|
| NFR-004 | Password hashing (bcrypt) |
| NFR-005 | JWT authentication (7 days) |
| NFR-006 | HTTPS encryption |

### 3.3 Scalability
| ID | Requirement |
|----|-------------|
| NFR-007 | Responsive design |
| NFR-008 | Modular architecture |

---

## 4. Database Schema (MongoDB)

### Collections

| Collection | Description |
|------------|-------------|
| `users` | User accounts, profiles, learning goals |
| `subjects` | Subjects and topics |
| `questions` | AI-generated questions |
| `assessments` | Entry tests and results |
| `learning_paths` | Personalized learning paths |
| `practice_sessions` | Practice sessions with adaptive difficulty |

### Key Relationships
```
User 1--* Assessment
User 1--* LearningPath
User 1--* PracticeSession
Subject 1--* Question
Subject 1--* Topic
Assessment 1--* Question (embedded)
```

---

## 5. API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login user |
| GET | `/api/auth/me` | Get current user |

### Health
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |

---

## 6. Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 15, React 19, TypeScript, Tailwind CSS v4, shadcn/ui |
| Backend | Express.js, TypeScript, Mongoose ODM |
| Database | MongoDB |
| AI | Claude API / OpenAI GPT |
| Auth | JWT + bcryptjs |
| Validation | Zod |

---

## 7. System Architecture

```
┌─────────────┐     REST API      ┌─────────────┐
│   Frontend  │ ◄──────────────► │   Backend   │
│  (Next.js)  │                  │  (Express)  │
└─────────────┘                  └──────┬──────┘
                                        │
                                  ┌─────▼─────┐
                                  │  MongoDB  │
                                  └───────────┘
```

---

## 8. Use Case Diagram

```mermaid
flowchart LR
    %% Actors
    User([Người dùng])
    AI([Hệ thống AI])

    %% Groups
    subgraph Auth[Quản lý]
        Register[Đăng ký]
        Login[Đăng nhập]
    end

    subgraph Assessment[Đánh giá]
        GenTest[Sinh test]
        TakeTest[Làm bài]
        Grade[Chấm điểm]
    end

    subgraph Learning[Học tập]
        Path[Xem lộ trình]
        Practice[Luyện tập]
    end

    User --> Auth & Assessment & Learning
    AI --> GenTest & Grade
```

### Use Case Summary

| Actor | Use Cases |
|-------|-----------|
| User | Register, Login, Take Test, View Path, Practice |
| AI | Generate Test, Grade, Analyze Results |

---

**Date:** 27/02/2026
**Author:** Tran Do Lan Phuong
**MSV:** B23DCCN667
