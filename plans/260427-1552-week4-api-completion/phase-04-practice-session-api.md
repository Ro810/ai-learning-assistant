# Phase 04 — Practice Session API

## Context Links
- Model: `backend/src/models/practice-session.model.ts` (mode `adaptive|exam_simulation`, settings.questionCount/difficultyRange/timeLimitMinutes, adaptiveState, results.weakTopicIds)
- Reuse: `backend/src/services/question-generator.service.ts` for AI fallback when bank empty
- Reuse: `Question` model for fetching from existing pool (`Question.find({ topicIds: { $in: topicIds }, difficulty: { $gte, $lte } })`)
- User weak-topic field: `User.currentLevel.weakTopics: ObjectId[]` (`backend/src/models/user.model.ts:64`)

## Overview
- **Priority:** P1
- **Status:** pending
- **Description:** Lifecycle for practice sessions: start → submit → finish. Pulls questions from existing bank first; generates via AI only if shortfall. Updates `User.currentLevel.weakTopics` on completion.

## Key Insights
- Adaptive mode: simple stepwise diff change. After 2 consecutive correct → diff++; after 2 wrong → diff--. Bound `[1,3]`. Don't over-engineer (KISS) — store via `adaptiveState` field already in model.
- `exam_simulation`: fixed difficulty range, no adaptation, optional time limit.
- Question selection: prefer reusing bank to control AI cost. Increment `Question.usageCount`.
- Weak-topic detection on completion: any topic with accuracy < 0.5 → add to `User.currentLevel.weakTopics` (deduped).
- All questions are `multiple_choice` (per Phase 02 cleanup). Grading is uniform string compare; no essay branch.
- **One in-progress session per user globally** — hard-blocked at create. Caller must finish or abandon before starting another. 409 payload: `{ existingId, message: "Bạn còn 1 bài đang làm dở, hoàn thành hoặc hủy trước." }`.

## Requirements

### Functional
- `POST /api/practice-sessions` — body: `{ topicIds: [], mode, settings: { questionCount?, difficultyRange?, timeLimitMinutes? } }`. Picks questions, returns session w/ questions (without correctAnswer).
- `POST /api/practice-sessions/:id/answer` — single-answer submit `{ questionId, answer, timeSpentSeconds, hintUsed? }`. Grades immediately, updates adaptiveState. Returns `{ isCorrect, explanation, nextDifficulty }` (no full key reveal — only this question's explanation).
- `POST /api/practice-sessions/:id/finish` — end session, compute results, update user weak-topics, status='completed'. Idempotent (return existing results if already completed).
- `POST /api/practice-sessions/:id/abandon` — set status='abandoned', completedAt=now (no results computed). 409 if not in_progress. Allows user to discard a stale session so a new one can start.
- `GET /api/practice-sessions` — list with filters `?status`, `?topicId`, pagination.
- `GET /api/practice-sessions/:id` — full doc.
- `GET /api/practice-sessions/analytics/weak-topics` — current user's weakTopics enriched with topic names from Subject lookup.

### Non-functional
- Question selection latency target <500ms when bank has ≥N questions (skip AI).
- AI fallback only fires if bank yields < requestedCount.
- Files <200 LOC; split selector into helper.

## Architecture

### Data Flow — start
```
POST /api/practice-sessions
 ├─ Zod validate
 ├─ PracticeSession.findOne({ userId, status:'in_progress' })
 │   └─ if found → 409 { existingId, message: "Bạn còn 1 bài đang làm dở, hoàn thành hoặc hủy trước." }
 ├─ selectQuestions({ topicIds, difficultyRange, count })
 │   ├─ bank: Question.find({ topicIds:{$in}, difficulty:{$gte,$lte} }).sort({ usageCount: 1 }).limit(count)
 │   ├─ if shortfall: questionGenerator.generate({...}) for delta
 │   └─ return merged
 ├─ build session.questions[] with order index
 ├─ PracticeSession.create({...})
 └─ respond { session } (correctAnswer stripped)
```

### Data Flow — answer (per question)
```
POST /api/practice-sessions/:id/answer
 ├─ load session (own + in_progress)
 ├─ load Question (need correctAnswer + explanation, not in session doc)
 ├─ isCorrect = (question.content.correctAnswer === answer)
 ├─ patch session.questions[idx]
 ├─ adaptive: if mode==='adaptive', update consecutive counters and currentDifficulty
 ├─ Question.findByIdAndUpdate(id, { $inc: { usageCount: 1 } })  // fire-and-forget
 ├─ save session
 └─ respond { isCorrect, explanation, currentDifficulty }
```

### Data Flow — finish
```
POST /api/practice-sessions/:id/finish
 ├─ load session
 ├─ if already completed → return existing results (idempotent)
 ├─ compute: score, accuracyPercent, avgTimePerQuestion, weakTopicIds (per-topic ratio<0.5)
 ├─ User.updateOne({_id:userId}, { $addToSet: { 'currentLevel.weakTopics': { $each: weakTopicIds } } })
 ├─ session.results = {...}; status='completed'; completedAt=now
 └─ save and respond
```

### Service split
- `practice-question-selector.service.ts` (~120 LOC): bank query + AI fallback merge. Pure-ish (DB).
- `practice-grader.service.ts` (~100 LOC): pure funcs `applyAdaptive(state, isCorrect)`, `computePracticeResults(session)`, `findWeakTopicIds(session)`.

## Related Code Files

### Read
- `backend/src/models/practice-session.model.ts`
- `backend/src/models/question.model.ts`
- `backend/src/models/user.model.ts`
- `backend/src/services/question-generator.service.ts`

### Create
- `backend/src/routes/practice-session.routes.ts` (~140 LOC + Swagger)
- `backend/src/controllers/practice-session.controller.ts` (~190 LOC)
- `backend/src/services/practice-question-selector.service.ts` (~120 LOC)
- `backend/src/services/practice-grader.service.ts` (~100 LOC)

### Modify
- `backend/src/app.ts` — mount `/api/practice-sessions`.

## Implementation Steps
1. `practice-grader.service.ts`:
   - `applyAdaptive(state, isCorrect, mode)` returns new `{ currentDifficulty, consecutiveCorrect, consecutiveWrong }`. Bound [1,3].
   - `computeResults(session)` returns `{ score, accuracyPercent, avgTimePerQuestion, weakTopicIds }`.
2. `practice-question-selector.service.ts`:
   - `selectQuestions({ topicIds, difficultyRange, count, subjectId })` — bank query first, AI fill if shortfall, return array (max `count`).
3. Zod schemas: `createSessionSchema`, `answerSchema`.
4. `createSession` controller — in-progress global dedupe (`findOne({ userId, status:'in_progress' })`); if hit → 409 with `{ existingId, message }`. Else: selector, save.
5. `submitAnswer` controller — grade, adaptive update, usageCount++. 409 if session not in_progress.
6. `finishSession` controller — idempotent, compute, write user weak-topics with `$addToSet`.
7. `abandonSession` controller — load + ownership + `status === 'in_progress'` (409 otherwise) → status='abandoned', completedAt=now → save.
8. `listSessions`, `getSession`, `getWeakTopics` controllers.
9. Routes + Swagger.
10. Mount in `app.ts`.
11. `npm run build`.
12. Smoke: start session → second-create attempt returns 409 with existingId → abandon → re-create succeeds → answer 5 questions (mix correct/wrong) → finish → verify user.currentLevel.weakTopics populated → analytics endpoint returns names.

## Todo List
- [ ] `practice-grader.service.ts` with pure funcs
- [ ] `practice-question-selector.service.ts` with bank-first fill
- [ ] Zod schemas
- [ ] createSession (global in-progress 409 with existingId + selector)
- [ ] submitAnswer (grading + adaptive + usageCount)
- [ ] finishSession (idempotent + user weak-topic merge)
- [ ] abandonSession (status=abandoned, 409 if not in_progress)
- [ ] listSessions, getSession
- [ ] getWeakTopics analytics endpoint
- [ ] Routes + Swagger
- [ ] Mounted in app.ts
- [ ] `npm run build` clean
- [ ] Smoke test (full lifecycle)

## Success Criteria
- Start session with `count: 10` against a bank with 10+ matching questions → no AI call (verifiable via logs/usageCount).
- Start session with `count: 10` against bank of 3 → 7 new Question docs created.
- Adaptive: 2 correct in a row at diff=1 → next currentDifficulty=2.
- Finish session with topicX 1/3 correct → topicX in `weakTopicIds` and in `User.currentLevel.weakTopics`.
- `GET /api/practice-sessions/analytics/weak-topics` returns enriched names.
- Re-finishing returns same results (idempotent).
- POST `/api/practice-sessions` while user has another in-progress session → 409 with `{ existingId, message }`.
- POST `/api/practice-sessions/:id/abandon` on in_progress → 200; subsequent create succeeds. Abandon on already-completed → 409.

## Risk Assessment
| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Question fetch leaks `correctAnswer` to client | H | H | Selector returns full doc internally; controller maps to client view stripping correctAnswer + options[].isCorrect. |
| Adaptive logic infinite loop | L | M | Pure func, bounded [1,3], unit-testable. |
| usageCount increment causes write contention | L | L | Use `$inc`, fire-and-forget, no await blocking. |
| Weak-topic list grows unbounded for a user | M | L | `$addToSet` dedupes. Future: trim to last N. |
| AI fallback fails mid-creation → partial questions | M | M | Selector wraps AI call in try/catch; if all-AI fails, throw 502 and don't persist session. If partial bank+AI partial fail → degrade to bank-only count. |
| User stuck on stale in-progress session, blocking new creates | M | M | `POST /:id/abandon` provides explicit escape hatch. 409 payload includes `existingId` so client can deep-link to resume or call abandon. Document in Week 4 doc. |

## Security Considerations
- All routes `authMiddleware`.
- Ownership check on every read/write.
- Strip `correctAnswer` and `options[].isCorrect` from question payload sent to client at start.
- Per-answer response reveals only that question's explanation, not full key.
- Cap `settings.questionCount` to 50 via Zod.

## Next Steps
- Phase 06 picks up Swagger.
- Future: streak/XP gamification (out of scope).
- Future: practice recommendations driven by `weakTopics` (UI-side).

## Rollback
- Remove `app.use('/api/practice-sessions', ...)`. Existing sessions/users untouched.
- `User.currentLevel.weakTopics` is additive only via `$addToSet`; rollback leaves data intact and harmless.
