# Phase 01 — Subject Catalog (Seed + Read-only API)

## Context Links
- Model: `backend/src/models/subject.model.ts` (Subject doc with embedded `topics: TopicSchema[]`, `_id: true` per topic)
- Types: `backend/src/types/index.ts` (`ISubject`, `ITopic`)
- Pattern reference: `backend/src/routes/auth.routes.ts` (envelope), `backend/src/controllers/learning-path.controller.ts` (controller skeleton)
- Topic-name resolver pattern: `backend/src/services/question-generator.service.ts:11-27`
- Target audience reference (catalog content): `./README.md`

## Overview
- **Priority:** P1 (blocker for phases 03 & 04; assessment/practice need stable subject+topic IDs).
- **Status:** pending
- **Description:** Provide a fixed catalog of subjects + topics via a one-shot seed script. Expose read-only API for clients. **No CRUD endpoints** — catalog is curated, not user-editable.

## Key Insights
- `Subject.topics` is embedded array; topics addressed via `subjectId + topicId`. No standalone `Topic` collection.
- `Subject.code` is unique + lowercase trimmed — seed script must be idempotent (`upsert` by `code`).
- Topic `_id` is auto-generated on first insert; **subsequent re-runs of seed must not regenerate `_id`s** or downstream Question/Assessment refs break. Strategy: query existing subject by `code`, only insert missing topics by `name`.
- KISS: no CRUD, no admin role debate, no reference-check guards. Just a seed script + 2 GETs.

## Requirements

### Functional
- `GET /api/subjects` — list all subjects (id, name, code, description, topic count). Optional `?withTopics=true`.
- `GET /api/subjects/:id` — full subject incl. topics tree.
- Seed script `backend/src/scripts/seed-subjects.ts` — inserts/updates fixed catalog. Idempotent.
- npm script: `"seed:subjects": "ts-node-dev --transpile-only src/scripts/seed-subjects.ts"` in `backend/package.json` (reuse existing `ts-node-dev` dep — no new dependency). Run: `npm run seed:subjects`.

### Seed Catalog (target audiences from README)
1. **Toán THPT** (code: `math-thpt`) — topics: "Đại số", "Hình học", "Giải tích", "Lượng giác", "Xác suất - Thống kê".
2. **IELTS** (code: `ielts`) — topics: "Listening", "Reading", "Writing Task 1", "Writing Task 2", "Speaking".
3. **Lập trình Python** (code: `python-programming`) — topics: "Cú pháp cơ bản", "Cấu trúc dữ liệu", "OOP", "Thư viện chuẩn".
4. **Tiếng Anh giao tiếp** (code: `english-communication`) — topics: "Greetings & Small Talk", "Travel", "Business English", "Daily Life".

### Non-functional
- Read endpoints public (no auth). Optional auth still attaches `req.user` if token present (mirrors learning-path style).
- Files <150 LOC.

## Architecture

### Data Flow (read-only)
```
Client ─► GET /api/subjects[?withTopics] ─► controller (Subject.find) ─► response { success, data }
Client ─► GET /api/subjects/:id          ─► controller (validate id, Subject.findById) ─► response
```

### Seed Flow
```
seed-subjects.ts
 ├─ connect mongoose
 ├─ for each subject in catalog:
 │   ├─ Subject.findOne({ code })
 │   ├─ if missing → Subject.create({ name, code, description, topics: [{name},...] })
 │   └─ if exists → for each catalog topic, if not in existing.topics by name → push + save
 ├─ log summary (created/updated/skipped)
 └─ disconnect
```

## Related Code Files

### Read for context
- `backend/src/models/subject.model.ts`
- `backend/src/controllers/learning-path.controller.ts` (controller skeleton)
- `backend/src/app.ts` (where to mount router)
- `backend/src/config/database.ts` (mongoose connect helper if any; otherwise inline `MONGODB_URI`)

### Create
- `backend/src/routes/subject.routes.ts` (~60 LOC; just 2 GETs + Swagger JSDoc)
- `backend/src/controllers/subject.controller.ts` (~80 LOC; `listSubjects`, `getSubject`)
- `backend/src/scripts/seed-subjects.ts` (~120 LOC; standalone script)

### Modify
- `backend/src/app.ts` — `import subjectRoutes from './routes/subject.routes'; app.use('/api/subjects', subjectRoutes);`
- `backend/package.json` — add `"seed:subjects": "ts-node-dev --transpile-only src/scripts/seed-subjects.ts"`.

### Delete
- None.

## Implementation Steps
1. `subject.controller.ts`:
   - `listSubjects(req, res)` — `Subject.find({})`, optional `?withTopics=true` (else strip topics, attach `topicCount`).
   - `getSubject(req, res)` — `mongoose.Types.ObjectId.isValid` guard → `Subject.findById(id)` → 404 if missing.
2. `subject.routes.ts`:
   - `GET /` → `listSubjects`
   - `GET /:id` → `getSubject`
   - Swagger JSDoc on both (mirror `learning-path.routes.ts` style).
3. Mount in `app.ts`.
4. `scripts/seed-subjects.ts`:
   - Define `CATALOG: Array<{ name, code, description, topics: string[] }>` (4 entries above).
   - Connect mongoose using same connection logic as `server.ts`.
   - Loop catalog → upsert subjects by `code` → reconcile topics by `name`.
   - Print created/updated counts.
   - `process.exit(0)` on success / `1` on error.
5. Add `"seed:subjects"` to `backend/package.json` scripts.
6. `npm run build` to verify TS compiles.
7. Run `npm run seed:subjects` against dev Mongo → verify 4 subjects created.
8. Smoke test: `curl /api/subjects` returns 4 subjects with topicCount; `curl /api/subjects/:id` returns full doc with topics including auto-generated `_id`s.
9. Re-run `npm run seed:subjects` → verify no duplicate inserts (idempotent).

## Todo List
- [ ] Seed script `seed-subjects.ts` with catalog of 4 subjects
- [ ] npm script `seed:subjects` added
- [ ] `subject.controller.ts` — listSubjects, getSubject
- [ ] `subject.routes.ts` — 2 GETs + Swagger
- [ ] Mounted in app.ts
- [ ] `npm run build` clean
- [ ] Seed runs cleanly first time (4 subjects created)
- [ ] Re-running seed is idempotent (no duplicates, no re-_id'd topics)
- [ ] `curl /api/subjects` and `curl /api/subjects/:id` return expected payloads

## Success Criteria
- After `npm run seed:subjects`, `Subject.countDocuments() === 4`; each subject has 4-5 topics with stable `_id`s across runs.
- `GET /api/subjects` returns 200 with array of 4 entries.
- `GET /api/subjects/:id` returns full doc; bad ObjectId → 400; missing → 404.
- Swagger UI lists exactly 2 endpoints under "Subjects" tag.
- No POST/PATCH/DELETE endpoint exists for subjects or topics.

## Risk Assessment
| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Re-running seed regenerates topic `_id`s, breaking Question/Assessment topic refs | M | H | Reconcile by `name` not by replacing array. Never overwrite existing topics. Document in script header. |
| Seed runs against production DB by accident | L | H | Script reads `MONGODB_URI` from env; require `NODE_ENV !== 'production'` OR explicit `ALLOW_PROD_SEED=1` flag — log + abort otherwise. |
| Catalog content inadequate for assessment generation | L | M | Topic names are descriptive enough for AI prompt grounding. Adjustable: edit constant in script + re-seed. |
| Listed subjects misalign with frontend dropdowns later | L | L | Read-only API means frontend always reflects DB state — no drift possible. |

## Security Considerations
- Reads are public (no PII). No auth needed.
- No write endpoints → no mutation surface, no admin-role debate.
- Seed script only runs server-side via npm command; no HTTP exposure.
- Cap topic count and subject count in catalog (currently 4 subjects × 4-5 topics) — no abuse vector.

## Next Steps
- Unblocks Phase 03 (assessment needs `subjectId` + `topicIds`).
- Unblocks Phase 04 (practice picks topics).
- Phase 06 picks up Swagger annotations for the 2 GETs.

## Rollback
- Remove `app.use('/api/subjects', ...)` line in `app.ts`. Routes/controllers files untouched.
- Seed data: `db.subjects.deleteMany({ code: { $in: ['math-thpt','ielts','python-programming','english-communication'] } })` if a clean wipe is needed.
- No structural DB migration → no schema rollback.
