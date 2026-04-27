# Phase 03 — Assessment API

## Context Links
- Model: `backend/src/models/assessment.model.ts` (status `in_progress|completed`, embedded questions w/ snapshot, results.skillAnalysis[], recommendedLevel)
- Reuse: `backend/src/services/question-generator.service.ts` (calls AI + saves Questions)
- Reuse: `backend/src/services/learning-path-generator.service.ts:74-89` (consumes assessment.results.skillAnalysis — must keep field shape)
- Pattern: `backend/src/controllers/learning-path.controller.ts` (controller w/ Zod + ObjectId casts + envelope)

## Overview
- **Priority:** P1 (LearningPath generator reads assessment.results — currently only the model exists, no API to populate it).
- **Status:** pending
- **Description:** Create assessment, auto-generate question set, accept submitted answers, auto-grade by snapshot's `correctAnswer`, write `skillAnalysis` per topic, derive `recommendedLevel`. Read endpoints for history.

## Key Insights
- `questionSnapshot` is **mandatory** — questions can be deleted later, snapshot preserves grading integrity.
- Grading is deterministic: all questions are `multiple_choice` (per Phase 02 cleanup) → string compare against snapshot's `correctAnswer`. No essay branch, no `isCorrect: null`. Every question contributes to score.
- `skillAnalysis` is the contract with LearningPath generator (`learning-path-generator.service.ts:74-89` uses `correct/total` ratio thresholds 0.7 and 0.5). Don't break field names: `topicId`, `correct`, `total`, `level`.
- `recommendedLevel` enum unconstrained in model but generator consumes the string directly. Use `'basic' | 'intermediate' | 'advanced'` for consistency with `learningGoals.targetLevel`.
- **One in-progress assessment per (user, subject) at a time — hard-blocked at create.** Caller must finish or explicitly abandon before starting another.

## Requirements

### Functional
- `POST /api/assessments` — body: `{ subjectId, topicIds?, difficulty?, questionCount? }`. **Pre-check:** if user already has an in-progress assessment for this `subjectId` → return 409 with payload `{ existingId, message: "Bạn còn 1 bài đang làm dở, hoàn thành hoặc hủy trước." }`. Otherwise generates questions via `questionGenerator.generate(...)`, snapshots them into assessment.questions[], status `in_progress`. Returns assessment incl. questions (without `correctAnswer` exposed in client view — see Security).
- `GET /api/assessments` — list user's assessments (id, subjectId, status, score, createdAt). Pagination.
- `GET /api/assessments/:id` — full doc (results visible only when `status === 'completed'`).
- `POST /api/assessments/:id/submit` — body: `{ answers: [{ questionId, answer, timeSpentSeconds? }] }`. Grades, writes results, sets status=completed, completedAt. Idempotent rejection if already completed (409).
- `POST /api/assessments/:id/abandon` — set status=`abandoned`, write `completedAt`. No grading. Allows user to discard a stale in-progress record so a new assessment can start. 409 if already completed/abandoned.
- `DELETE /api/assessments/:id` — delete own assessment (any status).

### Non-functional
- Question generation: cap `questionCount` at 20 (Zod). Default 10.
- AI failure must surface as 502 with message; don't persist half-baked assessment.
- Grading runs in-memory (no extra DB hit per question).

## Architecture

### Data Flow — create
```
POST /api/assessments
 ├─ Zod validate
 ├─ Assessment.findOne({ userId, subjectId, status:'in_progress' })
 │   └─ if found → 409 { existingId, message: "Bạn còn 1 bài đang làm dở, hoàn thành hoặc hủy trước." }
 ├─ if no topicIds: load Subject, default to all topics
 ├─ questionGenerator.generate({ subjectId, topicIds, difficulty, count })
 ├─ build assessment.questions[] with questionSnapshot = full question doc
 ├─ Assessment.create({ userId, subjectId, status:'in_progress', questions })
 └─ respond { assessment } (strip correctAnswer from snapshots in payload)
```

### Data Flow — abandon
```
POST /api/assessments/:id/abandon
 ├─ load assessment (own)
 ├─ if status !== 'in_progress' → 409 { message: "Cannot abandon: already completed or abandoned." }
 ├─ status='abandoned'; completedAt=new Date()
 └─ save and respond { success: true }
```

### Data Flow — submit (auto-grade, all MC)
```
POST /api/assessments/:id/submit
 ├─ load assessment (must be own + in_progress)
 ├─ for each snapshot: find user answer by questionId; set userAnswer, isCorrect = (snapshot.correctAnswer === answer), timeSpentSeconds. Unanswered → isCorrect=false.
 ├─ aggregate per topicId from snapshots: { correct, total }
 ├─ derive level per topic: ratio>=0.8 'advanced', >=0.5 'intermediate', else 'basic'
 ├─ score = correctCount/total*100; recommendedLevel = mode(skillAnalysis.level) or fallback 'basic'
 ├─ status='completed', completedAt=new Date()
 └─ save and respond
```

### Service split (KISS)
- `assessment-grader.service.ts` (~120 LOC) — pure functions: `gradeAnswers`, `buildSkillAnalysis`, `deriveRecommendedLevel`. Pure for unit testing.
- Keep create/list/get/delete logic inline in controller.

## Related Code Files

### Read
- `backend/src/models/assessment.model.ts`
- `backend/src/models/subject.model.ts` (for default-all-topics)
- `backend/src/services/question-generator.service.ts`
- `backend/src/services/learning-path-generator.service.ts` (downstream consumer)
- `backend/src/controllers/learning-path.controller.ts`

### Create
- `backend/src/routes/assessment.routes.ts` (~120 LOC + Swagger)
- `backend/src/controllers/assessment.controller.ts` (~180 LOC)
- `backend/src/services/assessment-grader.service.ts` (~120 LOC, pure)

### Modify
- `backend/src/app.ts` — mount `/api/assessments`.
- `backend/src/models/assessment.model.ts:69` — widen status enum from `['in_progress', 'completed']` to `['in_progress', 'completed', 'abandoned']`. Existing docs unaffected (additive enum change).
- `backend/src/types/index.ts` — if `IAssessment.status` literal union exists, widen to include `'abandoned'`.

### Delete
- None.

## Implementation Steps
1. Widen `assessment.model.ts:69` status enum to `['in_progress', 'completed', 'abandoned']`. Update `IAssessment.status` type if narrowed.
2. `assessment-grader.service.ts` — export pure funcs:
   - `gradeAnswers(snapshots, answers): GradedQuestion[]` (deterministic MC string compare; unanswered → isCorrect=false)
   - `buildSkillAnalysis(graded): SkillAnalysisItem[]`  (groups by `snapshot.topicIds[0]`; per-topic correct/total/level)
   - `deriveRecommendedLevel(skillAnalysis): string`
3. Zod schemas: `createAssessmentSchema`, `submitAssessmentSchema`.
4. `createAssessment` controller: validate → `Assessment.findOne({userId, subjectId, status:'in_progress'})` → if exists, 409 with `{ existingId, message }` → resolve topicIds (default = subject.topics) → call `questionGenerator.generate` → build questions array with snapshot (include all question fields) → save Assessment → strip `correctAnswer`/`isCorrect`-on-options before responding.
5. `submitAssessment` controller: load + ownership + `status === 'in_progress'` check (409 otherwise) → `gradeAnswers` → write each questions[].userAnswer/isCorrect/timeSpent → `buildSkillAnalysis` → `deriveRecommendedLevel` → set results, status='completed', completedAt → save.
6. `abandonAssessment` controller: load + ownership + `status === 'in_progress'` check (409 otherwise) → set status='abandoned', completedAt → save.
7. `getAssessment`/`listAssessments`/`deleteAssessment` — mirror learning-path patterns. List: filter `userId`, optional `?status`, `?subjectId`, paginate page/limit.
8. Routes file with Swagger JSDoc per endpoint (incl. `POST /:id/abandon`).
9. Mount in `app.ts`.
10. `npm run build`.
11. Smoke: create → list → submit answers → verify results.skillAnalysis matches expected ratios → second submit returns 409 → create new assessment same subject → expect 409 with existingId → abandon old → create succeeds.

## Todo List
- [ ] `assessment.model.ts` status enum widened to include `'abandoned'`
- [ ] `assessment-grader.service.ts` with 3 pure funcs (no essay branch)
- [ ] Zod schemas
- [ ] createAssessment (in-progress guard 409 + answer stripping)
- [ ] submitAssessment (grading + status transition)
- [ ] abandonAssessment (status=abandoned)
- [ ] getAssessment, listAssessments, deleteAssessment
- [ ] Routes + Swagger (incl. `POST /:id/abandon`)
- [ ] Mounted in app.ts
- [ ] `npm run build` clean
- [ ] Smoke test passed (incl. abandon → re-create flow)
- [ ] LearningPath generator still works on a fresh assessment (regression check)

## Success Criteria
- POST `/api/assessments` returns assessment with N questions, no `correctAnswer` leaked.
- Submitting all-correct answers → score=100, recommendedLevel='advanced'.
- Submitting all-wrong → score=0, recommendedLevel='basic'.
- `skillAnalysis[].topicId/correct/total/level` shape unchanged → LearningPath generator's filter at line 79-83 still works.
- Re-submit on completed assessment → 409.
- POST `/api/assessments` while another in-progress exists for same subject → 409 with `{ existingId, message }`.
- POST `/api/assessments/:id/abandon` on in_progress → 200; subsequent create for same subject succeeds.
- POST abandon on already-completed → 409.
- DELETE removes own; foreign id → 404.

## Risk Assessment
| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| AI generation flaky → orphaned in-progress assessments | M | M | Save Assessment only after questionGenerator succeeds (atomic). Add `DELETE` so user can clean up. |
| `correctAnswer` leaks via snapshot in create response | H | H | Explicit strip helper before response — never `res.json(assessment)` raw. |
| Topic with 0 questions skews analysis | L | M | If a topic has total=0, exclude from skillAnalysis. |
| Breaking change to skillAnalysis shape breaks LearningPath generator | L | H | Lock field names (step 1 helper). Add manual regression check (todo). |
| User submits answers for unknown questionId | M | L | Ignore unknown ids, log warn; don't 400 to keep UX smooth. |
| Race: two concurrent creates produce two in_progress | L | M | Best-effort guard via `findOne({ status:'in_progress' })`. Acceptable for MVP; no transaction. |
| User stuck with stale in_progress, can't restart | M | M | `POST /:id/abandon` provides explicit escape hatch. Documented in 409 message. |
| Frontend treats 409 on create as fatal error | M | L | 409 payload includes `existingId` so client can deep-link to resume or call abandon. Document in Week 4 doc. |

## Security Considerations
- All routes `authMiddleware`.
- Ownership check on every read/write/delete: `Assessment.findOne({ _id, userId })`.
- Strip `correctAnswer` and `options[].isCorrect` from `questionSnapshot` in create + in-progress get response. Reveal only after `status === 'completed'`.
- Cap `questionCount` to prevent AI cost abuse.

## Next Steps
- Phase 06: Swagger annotations.
- Future: integrate with LearningPath generator UX.
- Out of scope: essay grading (essay type removed entirely in Phase 02 cleanup).

## Rollback
- Remove `app.use('/api/assessments', ...)` line. Existing assessments in DB unaffected.
- LearningPath generator keeps working since it reads from existing `Assessment` collection regardless of how docs got there.
