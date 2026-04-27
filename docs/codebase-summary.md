# Codebase Summary

Last updated: 2026-04-27
Snapshot scope: backend Week 1–4 complete; frontend bootstrap only.

## Repository Layout
- `backend/` — Express + TypeScript + Mongoose + MongoDB
- `frontend/` — Next.js 16 App Router (bootstrap only — no pages yet beyond placeholder)
- `docs/` — weekly progress + API docs
- `plans/` — implementation plans + agent reports

## Backend (Week 1–4 ✅)

### Entry / Wiring
- `src/server.ts`, `src/app.ts` — Express + CORS + Swagger UI mount
- `src/config/database.ts`, `src/config/mongoose-setup.ts`, `src/config/swagger.ts`

### Auth (Week 2 + Week 4 extension)
- `src/routes/auth.routes.ts` — register / login / me / **PATCH password** / **PATCH email**
- `src/services/auth.service.ts` — JWT sign/verify, bcrypt, mock-mode fallback, **changePassword**, **changeEmail**
- `src/middleware/auth.middleware.ts` — `authMiddleware`, `optionalAuthMiddleware`

### AI integration (Week 3)
- `src/services/claude.service.ts` — Claude SDK wrapper (`IAIProvider`)
- `src/services/ai.service.ts` — provider factory
- `src/services/question-generator.service.ts` — prompt + Question persistence (MC only)
- `src/services/learning-path-generator.service.ts` — reads `Assessment.results.skillAnalysis`

### Subject catalog (Week 4 — Phase 01)
- `src/routes/subject.routes.ts` — `GET /api/subjects`, `GET /api/subjects/:id` (public read-only)
- `src/controllers/subject.controller.ts`
- `src/scripts/seed-subjects.ts` — idempotent catalog seed (`npm run seed:subjects`)

### Question system cleanup (Week 4 — Phase 02)
- Reduced `questionType` to literal `'multiple_choice'` across types/model/Zod/prompt/Swagger.
- No `fill_blank`/`essay` references remain.

### Assessment API (Week 4 — Phase 03)
- `src/routes/assessment.routes.ts` — create / list / get / submit / abandon / delete
- `src/controllers/assessment.controller.ts` — Zod, ownership, in-progress 409 guard, answer-key strip
- `src/services/assessment-grader.service.ts` — pure `gradeAnswers`, `buildSkillAnalysis`, `deriveRecommendedLevel`
- `src/models/assessment.model.ts` — status enum widened to `[in_progress, completed, abandoned]`

### Practice Session API (Week 4 — Phase 04)
- `src/routes/practice-session.routes.ts` — create / list / get / answer / finish / abandon / weak-topics analytics
- `src/controllers/practice-session.controller.ts` — global single-in-progress 409 guard
- `src/services/practice-grader.service.ts` — pure `applyAdaptive`, `computePracticeResults`
- `src/services/practice-question-selector.service.ts` — bank-first by `usageCount`, AI fallback when shortfall

### User Profile API (Week 4 — Phase 05)
- `src/routes/user.routes.ts` — `PATCH /me`, learning-goals CRUD, current-level set
- `src/controllers/user.controller.ts` — Zod whitelist (no mass-assignment), subject existence checks

### Models
- `user`, `subject` (embedded `topics[]`), `question`, `assessment`, `learning-path`, `practice-session`

### Mounted routes
```
/api/auth              (register, login, me, password, email)
/api/users             (profile, goals, current-level)
/api/subjects          (read-only)
/api/questions         (AI generation + library CRUD)
/api/assessments       (lifecycle + grading)
/api/practice-sessions (lifecycle + adaptive + analytics)
/api/learning-paths    (AI-generated, reads from assessment)
```

Total: ~25 endpoints, all annotated with Swagger JSDoc → discoverable at `/api-docs`.

## Frontend (Bootstrap only)
- Next.js 16 + React 19 + Tailwind v4 + shadcn primitives (button, card, input, badge, separator)
- `src/app/page.tsx` — placeholder; no real pages yet
- Empty `src/fixtures/`, `src/types/`

## Key Cross-cutting Conventions
- Response envelope: `{ success: boolean, data?, message?, errors? }`
- Status codes: 200/201 OK, 400 validation, 401 auth, 404 missing/foreign, 409 conflict, 502 AI failure
- All authed routes use `authMiddleware`; ownership enforced via `userId` filter
- Single-in-progress rule: assessment per (user, subject); practice global. Both expose `/:id/abandon`
- Question type: `'multiple_choice'` only across the system
- Mongoose `lean()` used for read paths; `findByIdAndUpdate({ new: true })` for atomic updates
- Zod whitelist on every body; no `req.body` spread

## Notable Documentation
- `Week1-Requirement-Analysis.md`
- `Week2-Backend-Setup.md`
- `Week3-AI-Integration.md`
- `Week4-API-Completion.md` ← latest

## Outstanding Gaps
- Frontend pages (Week 5+): auth, dashboard, assessment runner, practice runner, profile
- Tests: no unit/integration/e2e suite yet (planned Week 7)
- Production hardening: rate-limit middleware, `/api-docs` gating, JWT versioning on password change
- `docs/system-architecture.md`, `docs/code-standards.md`, `docs/project-overview-pdr.md` not yet authored
