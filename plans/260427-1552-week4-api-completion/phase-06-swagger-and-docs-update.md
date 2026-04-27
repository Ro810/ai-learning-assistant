# Phase 06 — Swagger & Docs Update

## Context Links
- Swagger config: `backend/src/config/swagger.ts` (`apis: ['./src/routes/*.ts']` — auto-picks new routes)
- Swagger UI mount: `backend/src/app.ts:27-31`
- Existing docs in `docs/`: `Week1-Requirement-Analysis.md`, `Week2-Backend-Setup.md`, `Week3-AI-Integration.md`, `codebase-summary.md`
- Pattern reference: `backend/src/routes/learning-path.routes.ts` (full Swagger JSDoc block style)

## Overview
- **Priority:** P2 (consolidation; runs after 01–05)
- **Status:** pending
- **Description:** Verify Swagger annotations are complete on all new routes (subjects read-only, assessment, practice, user profile, auth password+email), add missing pieces, and write `docs/Week4-API-Completion.md` matching the format of `Week3-AI-Integration.md`. Update `docs/codebase-summary.md` to reflect new modules.

## Key Insights
- `swagger-jsdoc` glob pattern is already inclusive (`./src/routes/*.ts`) — new route files auto-discovered. No swagger.ts edit unless adding shared component schemas.
- Adding shared component schemas (e.g., `Subject`, `Topic`, `Assessment`, `PracticeSession`) reduces JSDoc duplication across routes (DRY). Define under `components.schemas` in `swagger.ts`.
- Doc style precedent: Week3 doc uses Vietnamese headings + bilingual code/table style — match for consistency.

## Requirements

### Functional
- Every new endpoint from phases 01–05 has `@swagger` JSDoc with: tag, summary, security (if auth), requestBody schema, responses 200/201/400/401/404/409 as relevant.
- `swagger.ts` includes shared `components.schemas` for `Subject`, `Topic`, `Assessment`, `AssessmentResults`, `PracticeSession`, `LearningGoal`. Use `$ref` in route JSDoc to keep <200 LOC per route file.
- `docs/Week4-API-Completion.md` written.
- `docs/codebase-summary.md` updated with new files list (or stub a NOTE if structure differs).

### Non-functional
- `/api-docs` UI loads without errors — verify in browser/curl.
- All examples in Week4 doc are runnable curl commands.

## Architecture

### Swagger structure
```
swagger.ts
 ├─ definition.components.schemas: { Subject, Topic, Assessment, AssessmentResults, PracticeSession, PracticeQuestion, LearningGoal, ErrorResponse }
 └─ apis: ['./src/routes/*.ts']  (unchanged)

routes/*.ts
 └─ @swagger blocks reference $ref: '#/components/schemas/Subject' etc.
```

### Doc structure (Week4-API-Completion.md)
1. Overview (goal, scope)
2. Endpoint summary table (method/endpoint/auth/desc)
3. Subject API — request/response examples
4. Assessment API — full lifecycle example (create → submit → results)
5. Practice Session API — full lifecycle example
6. User Profile API — examples
7. Auth & Error envelope conventions
8. Mermaid diagram of feature data flows (assessment → learning path; practice → user weak-topics)
9. Test checklist

## Related Code Files

### Read
- All new files from phases 01–05
- `backend/src/config/swagger.ts`
- `backend/src/routes/auth.routes.ts`, `learning-path.routes.ts` (style reference)
- `docs/Week3-AI-Integration.md` (format reference)
- `docs/codebase-summary.md`

### Modify
- `backend/src/config/swagger.ts` — add `components.schemas`
- `backend/src/routes/subject.routes.ts` — refactor JSDoc to use `$ref` (optional)
- `backend/src/routes/assessment.routes.ts` — same
- `backend/src/routes/practice-session.routes.ts` — same
- `backend/src/routes/user.routes.ts` — same
- `docs/codebase-summary.md`

### Create
- `docs/Week4-API-Completion.md`

## Implementation Steps
1. Audit each new route file: confirm every endpoint has `@swagger` block. Fill gaps.
2. Edit `swagger.ts`: add `components.schemas` for `Subject`, `Topic`, `Assessment`, `AssessmentQuestion`, `AssessmentResults`, `PracticeSession`, `PracticeQuestion`, `LearningGoal`, `ErrorResponse`.
3. Refactor route JSDoc to use `$ref` where it reduces lines noticeably.
4. Run backend, hit `http://localhost:5000/api-docs` — visually verify each tag group renders.
5. `curl http://localhost:5000/api-docs.json | jq '.paths | keys'` — confirm endpoint count matches.
6. Write `docs/Week4-API-Completion.md` per structure above. Include curl examples for happy path of each phase.
7. Add Mermaid diagrams (use `/mermaidjs-v11` skill conventions if applicable):
   - Assessment lifecycle: states `in_progress → completed` with grading/learning-path-trigger.
   - Practice session adaptive flow: answer → adaptive update → next question selection.
8. Update `docs/codebase-summary.md` with new modules under backend (routes/, controllers/, services/).
9. Final smoke test: full E2E flow — register → create subject + topics → create assessment → submit → create learning path from assessment → start practice → answer → finish → check user weak-topics → update profile.

## Todo List
- [ ] Audit Swagger coverage on all new routes
- [ ] `components.schemas` defined in swagger.ts
- [ ] Route JSDoc refactored to $ref where helpful
- [ ] /api-docs UI verified (no errors)
- [ ] /api-docs.json endpoint count matches
- [ ] `docs/Week4-API-Completion.md` written with examples
- [ ] Mermaid diagrams included
- [ ] `docs/codebase-summary.md` updated
- [ ] Full E2E smoke test passed

## Success Criteria
- `/api-docs` lists every endpoint from phases 01–05 grouped under correct tags (Subjects, Assessments, Practice Sessions, Users, Auth).
- Every endpoint shows requestBody / response schemas (no "any").
- `docs/Week4-API-Completion.md` exists, ≥1 curl example per endpoint family.
- E2E smoke (register → ... → finish practice → change password → login with new password) succeeds with no 500.

## Risk Assessment
| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Stale Swagger after future code changes | M | L | Annotations live next to code; CI doc-build check (future). |
| `$ref` typos cause schemas to not render | M | M | Verify in `/api-docs.json` after each batch. |
| Doc drifts from impl (e.g., endpoint paths typed wrong) | M | M | Copy curl examples directly from smoke test transcript. |
| Mermaid syntax errors break rendering | L | L | Use mermaidjs-v11 skill or paste-test in mermaid live editor. |

## Security Considerations
- Swagger UI at `/api-docs` remains public; acceptable for MVP/academic project. Revisit before commercial deployment.
- `bearerAuth` security scheme already declared globally in `swagger.ts`. New routes inherit; verify `security: - bearerAuth: []` is on every authed route's JSDoc.

## Next Steps
- Future (pre-commercial): gate `/api-docs` behind env flag or basic auth.
- Future: generate OpenAPI client SDK for frontend (out of scope).

## Rollback
- Revert `swagger.ts` to remove components.schemas; route JSDoc remains valid (no `$ref` dependency if not used).
- Delete `docs/Week4-API-Completion.md`.
- No runtime impact.
