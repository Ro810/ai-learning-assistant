---
title: "Week 4 — Backend API Completion"
description: "Subject seed+read API, MC-only refactor, Assessment, Practice Session, User Profile + credentials, Swagger/docs"
status: pending
priority: P1
effort: 17h
branch: main
tags: [backend, api, week4, assessment, practice, profile, refactor]
created: 2026-04-27
---

# Week 4 — Backend API Completion

## Goal
Close the remaining backend gaps so frontend can build full UX: seed-only Subject catalog, MC-only refactor of Week 2-3 question types, Assessment flow, Practice Session flow, User Profile + credential changes, and Swagger/docs sync.

## Scope
Reuse existing services (`question-generator`, `claude`, `ai`). No new infra. JWT auth on user-scoped endpoints, Zod validation per route, Swagger JSDoc, kebab-case files, <200 LOC per file. Single in-progress assessment/session per user (explicit abandon endpoint).

## Phase Status

| # | Phase | Status | Effort | Blocks |
|---|---|---|---|---|
| 01 | [Subject Catalog (Seed + Read-only)](./phase-01-subject-topic-api.md) | pending | 2h | 03, 04 |
| 02 | [Remove non-MC question types (cleanup)](./phase-02-remove-non-multiple-choice.md) | pending | 1h | 03, 04 |
| 03 | [Assessment API](./phase-03-assessment-api.md) | pending | 4h | LearningPath consumer |
| 04 | [Practice Session API](./phase-04-practice-session-api.md) | pending | 4h | — |
| 05 | [User Profile API (incl. password + email)](./phase-05-user-profile-api.md) | pending | 3h | — |
| 06 | [Swagger & Docs Update](./phase-06-swagger-and-docs-update.md) | pending | 3h | 01–05 |

## Dependency Graph
```
01 (Subject seed+read) ─┐
02 (MC-only cleanup)    ├─> 03 (Assessment) ──┐
                        ├─> 04 (Practice)     │
05 (Profile + creds) ───────────────────────────┐
                                              ├─> 06 (Swagger + Week4 doc)
```
- Phase 02 must complete before 03 and 04 (they assume MC-only grading).
- Phases 03, 04, 05 can run in parallel after 01 + 02 are done.

## Non-goals (YAGNI)
- No admin role system. Subjects are seed-only — no CRUD UI/API (see Decisions Log #1).
- No real-time grading streaming. Submit-then-grade only.
- No leaderboard / social features.
- No question regen on demand from assessment/practice (reuse existing `/api/questions/generate`).
- No password reset via email (only self-initiated change while authenticated).
- No JWT invalidation on password change (tokens valid until expiry).

## Cross-cutting Conventions
- Response envelope: `{ success: true, data: ... }` or `{ success: false, message, errors? }`. Match `auth.routes.ts` and `learning-path.controller.ts`.
- Auth: `router.use(authMiddleware)` for user-scoped routers. Subject reads public (no auth).
- Validation: Zod `safeParse` in controller, return 400 with `errors: parsed.error.errors` on failure.
- ObjectId casts: always validate via `mongoose.Types.ObjectId.isValid` before `new ObjectId(...)`; return 400 on bad id.
- Topic IDs are subdocs of `Subject.topics` — no direct populate. Resolve via `Subject.findById(...).select('topics')` like `question-generator.service.ts:11-27`.
- **Single in-progress per user:** assessment scoped by `subjectId`; practice global. Explicit `POST /:id/abandon` endpoint to release the slot.

## Reports
- Plan reports: `D:/ai-learning-assistant/plans/reports/`

## Definition of Done (Week 4)
- All 4 new resource families wired in `app.ts` (subjects, assessments, practice-sessions, users).
- `auth.routes.ts` has `PATCH /password` and `PATCH /email`.
- Phase 02 cleanup committed: zero references to `fill_blank` / `essay` in `backend/src`.
- `npm run build` passes (TS strict).
- `npm run seed:subjects` populates 4 subjects idempotently.
- `/api-docs` lists every new endpoint.
- `docs/Week4-API-Completion.md` written.
- Manual smoke test (curl/Postman) per phase Success Criteria succeeds.

## Decisions Log (2026-04-27)
1. **Subject/Topic: seed + read-only** (no CRUD UI/API). Catalog curated via `npm run seed:subjects`. Frontend dropdowns always reflect DB state, no admin role debate.
2. **Password & email change included in phase-05.** Live in `auth.routes.ts` (`PATCH /api/auth/password`, `PATCH /api/auth/email`) — touches credentials, requires bcrypt re-verify.
3. **Swagger `/api-docs` left public.** Acceptable for MVP/academic project. Revisit before commercial deployment.
4. **Question types reduced to `multiple_choice` only.** Week 2-3 cleanup runs as Phase 02 before assessment/practice phases. Removes `fill_blank` and `essay` from types, model enum, Zod, prompt builder, Swagger.
5. **Single in-progress assessment/session per user.** Assessment scoped by subjectId; practice global. Explicit `POST /:id/abandon` endpoint allows discarding stale records to start new ones. 409 payload includes `existingId` so client can deep-link to resume.
