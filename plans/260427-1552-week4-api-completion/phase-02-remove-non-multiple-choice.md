# Phase 02 — Remove non-multiple_choice question types (Week 2-3 cleanup)

## Context Links
- Decision source: Decisions Log entry #4 (plan.md, 2026-04-27).
- Type source: `backend/src/types/ai.types.ts:12,19` — `questionType` union.
- Type source: `backend/src/types/index.ts:79` — `Question.type` union.
- Model source: `backend/src/models/question.model.ts:41` — Mongoose enum.
- Controller source: `backend/src/controllers/question.controller.ts:12,30,37` — Zod input + default.
- Service source: `backend/src/services/question-generator.service.ts:31,74,99` — prompt label conditional.
- Route docs: `backend/src/routes/question.routes.ts:45-48` — Swagger JSDoc enum + default.

## Overview
- **Priority:** P1 (must run before phase 03/04 — assessment/practice grading code assumes single MC type).
- **Status:** pending
- **Description:** Refactor cleanup of Week 2-3 code: remove `fill_blank` and `essay` literals from types, model enum, Zod schemas, prompt builder, and Swagger docs. Keep `multiple_choice` as the only allowed value. This is a precondition for assessment/practice phases.

## Key Insights
- Single-value union is technically a `'multiple_choice'` literal. Two valid simplifications:
  - **(A) Keep field as `z.literal('multiple_choice')`** — preserves JSON shape; downstream consumers (frontend mocks, existing tests) keep working unchanged.
  - **(B) Drop the field entirely** — purer, but every reference to `q.type` becomes dead code; Question doc shape changes.
- **Recommendation: (A) — keep the field as a literal.** Rationale: minimal blast radius, no migration of existing Question docs, no frontend contract break. Mark "drop entirely" as a follow-up TODO once all callers are confirmed unused.
- The prompt-label conditional in `question-generator.service.ts:31` collapses to a single string literal — the conditional becomes dead code and can be removed (DRY).
- No DB migration needed for existing Question docs already stored with `type: 'multiple_choice'`. If any non-MC docs exist in dev DB, a one-shot delete is acceptable (catalog wipe via `db.questions.deleteMany({ type: { $ne: 'multiple_choice' } })`).
- Essay-grading branch (`isCorrect: null`) referenced in old assessment phase notes is now permanently gone — all questions auto-gradable via deterministic string compare.

## Requirements

### Functional
- All TypeScript types narrow `questionType` / `Question.type` to literal `'multiple_choice'`.
- Mongoose enum reduced to `['multiple_choice']`.
- Zod schema in `question.controller.ts` either:
  - keeps field as `z.literal('multiple_choice').optional().default('multiple_choice')`, OR
  - removes the field from the input schema entirely (still hardcodes value when constructing prompt input).
- Prompt builder hardcodes label "Trắc nghiệm"; remove conditional.
- Swagger JSDoc reflects single allowed value (or drops the field — match controller).
- `npm run build` passes after refactor (TS strict).

### Non-functional
- No new files. Edits only.
- Net LOC reduction (deleted conditional branches > added literals).
- All edits idempotent and reviewable in a single commit.

## Architecture

### Before
```
ai.types.ts    : type = 'multiple_choice' | 'fill_blank' | 'essay'
types/index.ts : Question.type = same union
question.model : enum: ['multiple_choice', 'fill_blank', 'essay']
controller     : z.enum([...3]).optional()
service        : label = MC ? 'Trắc nghiệm' : FB ? 'Điền khuyết' : 'Tự luận'
routes (jsdoc) : enum: [multiple_choice, fill_blank, essay]
```

### After (path A — keep literal)
```
ai.types.ts    : type = 'multiple_choice'
types/index.ts : Question.type = 'multiple_choice'
question.model : enum: ['multiple_choice'], default: 'multiple_choice'
controller     : z.literal('multiple_choice').optional().default('multiple_choice')
service        : const label = 'Trắc nghiệm';  // (or inlined)
routes (jsdoc) : enum: [multiple_choice], default: multiple_choice
```

## Related Code Files

### Read for context
- `backend/src/services/question-generator.service.ts` (full file — confirm prompt template structure before edit)
- `backend/src/controllers/question.controller.ts` (full file — confirm Zod + handler flow)

### Modify
- `backend/src/types/ai.types.ts` — narrow lines 12 and 19 to `'multiple_choice'` literal.
- `backend/src/types/index.ts` — narrow line 79 to `'multiple_choice'` literal.
- `backend/src/models/question.model.ts` — reduce enum at line 41 to `['multiple_choice']`. Confirm `default: 'multiple_choice'` exists; add if missing.
- `backend/src/controllers/question.controller.ts` — line 12: replace `z.enum([...])` with `z.literal('multiple_choice')` (keep `.optional()`). Lines 30/37: ensure default still resolves to `'multiple_choice'`.
- `backend/src/services/question-generator.service.ts` — line 31: replace conditional with `const questionTypeLabel = 'Trắc nghiệm';` (or inline directly into prompt template). Lines 74/99: verify no other branches reference the removed types — remove if found.
- `backend/src/routes/question.routes.ts` — lines 45-48: collapse enum to single value, keep `default: multiple_choice` for clarity.

### Create
- None.

### Delete
- None.

## Implementation Steps
1. Verify no untracked references via grep:
   `grep -rn "fill_blank\|essay\|short_answer\|true_false" backend/src` — should return ONLY the 5 files listed above. Resolve any unexpected hits before editing.
2. Edit `ai.types.ts:12` and `:19` — change union to `'multiple_choice'`.
3. Edit `types/index.ts:79` — same.
4. Edit `models/question.model.ts:41` — `enum: ['multiple_choice']`.
5. Edit `controllers/question.controller.ts:12` — replace `z.enum([...])` with `z.literal('multiple_choice').optional()`. Confirm line 37 default remains `'multiple_choice'`.
6. Edit `services/question-generator.service.ts:31` — collapse conditional to literal. Inspect lines 74 and 99 for any residual conditional branches keyed on `data.questionType` — remove dead branches.
7. Edit `routes/question.routes.ts:45-48` — JSDoc `enum: [multiple_choice]`.
8. Run `npm run build` in `backend/`. Fix any TS errors surfaced by narrower types.
9. Run existing question generation manually (curl `POST /api/questions/generate`) to confirm prompt still renders + AI still returns valid MC questions.
10. (Optional, dev DB hygiene) `db.questions.deleteMany({ type: { $ne: 'multiple_choice' } })` if any non-MC docs exist.

## Todo List
- [ ] Grep audit — only the 5 files match
- [ ] `ai.types.ts` narrowed (lines 12, 19)
- [ ] `types/index.ts:79` narrowed
- [ ] `question.model.ts:41` enum reduced
- [ ] `question.controller.ts` Zod schema replaced + default verified
- [ ] `question-generator.service.ts` prompt label collapsed; dead branches removed
- [ ] `question.routes.ts:45-48` Swagger enum reduced
- [ ] `npm run build` clean
- [ ] Manual curl smoke: `POST /api/questions/generate` returns MC questions
- [ ] (Optional) dev DB cleanup of non-MC docs

## Success Criteria
- `grep -rn "fill_blank\|essay\|short_answer\|true_false" backend/src` returns zero matches.
- `tsc --noEmit` passes.
- `POST /api/questions/generate` end-to-end works against Claude with default body (no `questionType` field).
- Swagger UI shows the field with single allowed value (or no field at all — depending on controller path chosen).
- No assessment/practice phase code (subsequent phases) needs an essay-grading branch.

## Risk Assessment
| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Hidden caller in untracked file (frontend, test, doc) sends `questionType: 'fill_blank'` and gets 400 | M | M | Step 1 grep extends to `frontend/`, `docs/`, `tests/`. Document break in commit msg. |
| Existing dev-DB Question docs with `type: 'essay'` fail Mongoose validation on next save | L | M | Step 10 cleanup deletes them. Mongoose enum validation only triggers on save, so reads still work. |
| Frontend stub/mock relies on union being 3-wide and breaks at compile time | L | L | Frontend currently scaffolded only; check `frontend/` for `questionType` references before edit (grep step 1 covers). |
| Removing the field entirely (path B) silently breaks any consumer reading `q.type` | M | M | Mitigated by recommending path A (keep as literal). Path B deferred to follow-up TODO. |
| Mongoose default not applied on already-saved docs (only on insert) | L | L | Existing docs already have `type: 'multiple_choice'` from earlier seeding. Verify with `db.questions.distinct('type')`. |

## Security Considerations
- No security surface change. Refactor is pure type narrowing + dead-code removal.
- AI cost unchanged (same prompt structure, same call site).

## Next Steps
- Phase 03 (Assessment) can now assume all questions are MC → simpler grading; `isCorrect: null` essay branch fully removed.
- Phase 04 (Practice) same — uniform grading.
- Phase 06 (Swagger) inherits the simplified enum automatically.
- Follow-up TODO (post-Week 4): evaluate whether to drop the `type` field entirely once all consumers are confirmed unused.

## Rollback
- Single revert of this commit restores all 6 files.
- No data loss risk: dev DB cleanup (step 10) is opt-in; if skipped, rollback is purely code-level.
- No schema migration on top of Mongoose; revert restores enum back to 3 values, existing docs continue to validate.
