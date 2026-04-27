# Phase 05 — User Profile API (incl. password + email change)

## Context Links
- Model: `backend/src/models/user.model.ts` (profile{name,avatarUrl,grade}, learningGoals[], currentLevel{subjectId,level,weakTopics})
- Existing endpoint: `GET /api/auth/me` in `backend/src/routes/auth.routes.ts:155-177` (already returns user data — must not duplicate; we extend with PATCH and learningGoals helpers)
- Type: `IUser` in `backend/src/types/index.ts`

## Overview
- **Priority:** P2
- **Status:** pending
- **Description:** Add update endpoints for user profile, learning goals, and credentials (password + email). Reads already covered by `GET /api/auth/me` — keep it as canonical read; add `PATCH /api/users/me` for profile updates, learning-goal endpoints, and `PATCH /api/auth/password` + `PATCH /api/auth/email` for credential changes.

## Key Insights
- `GET /api/auth/me` exists. **Don't duplicate** — keep auth.routes for read; new `users.routes` for writes only. (DRY)
- `learningGoals` is array of subdocs without `_id` in current schema. To enable PATCH/DELETE individual goals, set `_id: true` on the subdoc OR identify by `subjectId` (one goal per subject). Choose subjectId-as-key (KISS, no schema change) — enforce uniqueness at write time.
- `currentLevel.weakTopics` is auto-populated by Phase 04 (Practice); expose **read** via `GET /api/auth/me` only. No direct edit (avoid users gaming weak detection).
- Password and email change live in `auth.routes.ts` (NOT `user.routes.ts`) since they touch credentials and rely on `auth.service.ts` for bcrypt + JWT context. Separating credential ops from profile ops keeps mass-assignment surface narrow.

## Requirements

### Functional
- `PATCH /api/users/me` — body subset of `{ profile: { name?, avatarUrl?, grade? } }`. Partial update.
- `PUT /api/users/me/learning-goals` — body `{ goals: [{ subjectId, targetLevel, targetDate }] }`. Replaces full array (simpler than diff). Validates each subjectId exists. Enforces unique subjectId per goal.
- `POST /api/users/me/learning-goals` — append single goal. 409 if subjectId already in array.
- `DELETE /api/users/me/learning-goals/:subjectId` — remove goal by subjectId.
- `PATCH /api/users/me/current-level` — body `{ subjectId, level }` (string). Sets `currentLevel.subjectId` and `currentLevel.level`. Does NOT clear `weakTopics`.
- `PATCH /api/auth/password` — body `{ currentPassword, newPassword }`. JWT-protected. Verify `currentPassword` via `bcrypt.compare` against `User.passwordHash`. Hash `newPassword` with bcrypt (same cost factor as register), update. Min 8 chars (Zod). Returns 200 `{ success: true }` or 401 if currentPassword wrong.
- `PATCH /api/auth/email` — body `{ password, newEmail }`. JWT-protected. Verify `password` via bcrypt. Check `newEmail` lowercase + not already taken (`User.findOne({ email: newEmail })` → 409 if taken). Validate via Zod (`z.string().email()`). Update `User.email`. Returns updated user (sans `passwordHash`).

### Non-functional
- All writes return updated user (sans `passwordHash`).
- File <150 LOC.

## Architecture

### Data Flow
```
PATCH /api/users/me
 ├─ Zod validate (only profile.* keys)
 ├─ User.findByIdAndUpdate(userId, { $set: { 'profile.name': ..., 'profile.grade': ... } }, { new: true })
 └─ respond { user } (strip passwordHash)
```

```
PUT /api/users/me/learning-goals
 ├─ Zod validate (array of goals; coerce date string → Date)
 ├─ verify all subjectIds exist via Subject.find({_id:{$in:ids}}).countDocuments
 ├─ verify no dup subjectId in payload
 ├─ User.findByIdAndUpdate(userId, { $set: { learningGoals } }, { new: true })
 └─ respond
```

```
PATCH /api/auth/password
 ├─ Zod validate { currentPassword, newPassword (min 8) }
 ├─ User.findById(req.user.userId).select('+passwordHash')
 ├─ bcrypt.compare(currentPassword, user.passwordHash) → if false → 401
 ├─ user.passwordHash = bcrypt.hash(newPassword, COST)
 ├─ user.save()
 └─ respond { success: true }
```

```
PATCH /api/auth/email
 ├─ Zod validate { password, newEmail (email format) }
 ├─ User.findById(req.user.userId).select('+passwordHash')
 ├─ bcrypt.compare(password, user.passwordHash) → if false → 401
 ├─ if User.findOne({ email: newEmail.toLowerCase() }) → 409
 ├─ user.email = newEmail.toLowerCase(); user.save()
 └─ respond { success: true, user: stripUser(user) }
```

### Helper (KISS — inline)
- `stripUser(userDoc)` returns plain object without `passwordHash`. Place in controller (no shared util needed for one consumer).

## Related Code Files

### Read
- `backend/src/models/user.model.ts`
- `backend/src/models/subject.model.ts` (validate subjectId exists)
- `backend/src/routes/auth.routes.ts` (existing /me read; will append password + email change routes here)
- `backend/src/services/auth.service.ts` (`getCurrentUser` — pattern; bcrypt usage from register/login)

### Create
- `backend/src/routes/user.routes.ts` (~100 LOC + Swagger)
- `backend/src/controllers/user.controller.ts` (~140 LOC)

### Modify
- `backend/src/app.ts` — mount `/api/users`.
- `backend/src/routes/auth.routes.ts` — append `PATCH /password` and `PATCH /email` route definitions + Swagger JSDoc. Both behind `authMiddleware`.
- `backend/src/services/auth.service.ts` — add `changePassword(userId, currentPassword, newPassword)` and `changeEmail(userId, password, newEmail)` methods. Reuse existing bcrypt helpers and User model.
- `backend/src/controllers/auth.controller.ts` (or wherever auth route handlers live) — add `changePassword` and `changeEmail` handlers wrapping the service. If auth handlers are inline in routes, add them inline there.

### Delete
- None.

## Implementation Steps
1. Zod schemas in controller:
   - `updateProfileSchema = z.object({ profile: z.object({ name:z.string().min(2).optional(), avatarUrl:z.string().url().nullable().optional(), grade:z.string().nullable().optional() }) })`
   - `goalSchema = z.object({ subjectId: z.string(), targetLevel: z.enum(['basic','intermediate','advanced']), targetDate: z.string().datetime().or(z.string()) })`
   - `replaceGoalsSchema = z.object({ goals: z.array(goalSchema).max(10) })`
   - `setCurrentLevelSchema = z.object({ subjectId: z.string(), level: z.string() })`
2. `updateProfile` controller — `$set` only provided fields (build dotted-path patch from request).
3. `replaceLearningGoals` — verify all subjectIds exist (1 query), enforce uniqueness in payload, replace array.
4. `addLearningGoal` — load user → if `learningGoals.some(g=>g.subjectId.equals(subjectId))` → 409 → else `$push`.
5. `removeLearningGoal` — `$pull: { learningGoals: { subjectId: ... } }`.
6. `setCurrentLevel` — verify subjectId exists, `$set: { 'currentLevel.subjectId': ..., 'currentLevel.level': ... }`.
7. `user.routes.ts` — all routes under `authMiddleware`, Swagger JSDoc on each.
8. Mount in `app.ts`.
9. **Credential change (in `auth.routes.ts` + `auth.service.ts`):**
   - Zod schemas in auth route file: `changePasswordSchema = z.object({ currentPassword: z.string().min(1), newPassword: z.string().min(8) })`, `changeEmailSchema = z.object({ password: z.string().min(1), newEmail: z.string().email() })`.
   - Add `changePassword(userId, currentPassword, newPassword)` to `auth.service.ts`: select `+passwordHash`, `bcrypt.compare`, if false throw `UnauthorizedError` (or return null sentinel for controller to map to 401), `bcrypt.hash` new with same cost, save.
   - Add `changeEmail(userId, password, newEmail)` to `auth.service.ts`: select `+passwordHash`, `bcrypt.compare`, if false 401, lowercase newEmail, `User.findOne({email})` for taken check (return 409), update + save, return user without `passwordHash`.
   - Add `PATCH /password` and `PATCH /email` route handlers in `auth.routes.ts` behind `authMiddleware`. Map service errors to 401/409. Swagger JSDoc on both.
10. `npm run build`.
11. Smoke: PATCH name → verify GET /me reflects → PUT goals → verify → DELETE goal by subjectId → PATCH /api/auth/password (wrong current → 401; correct → 200; login with new password works) → PATCH /api/auth/email (wrong password → 401; taken email → 409; success → GET /me shows new email).

## Todo List
- [ ] Zod schemas (profile, goals, currentLevel, changePassword, changeEmail)
- [ ] updateProfile (partial $set)
- [ ] replaceLearningGoals (with subject existence check)
- [ ] addLearningGoal (with dedupe)
- [ ] removeLearningGoal
- [ ] setCurrentLevel
- [ ] `auth.service.ts` `changePassword` method (bcrypt verify + hash + save)
- [ ] `auth.service.ts` `changeEmail` method (bcrypt verify + uniqueness + save)
- [ ] `PATCH /api/auth/password` route + Swagger JSDoc
- [ ] `PATCH /api/auth/email` route + Swagger JSDoc
- [ ] User routes + Swagger
- [ ] Mounted in app.ts
- [ ] `npm run build` clean
- [ ] Smoke test (profile + goals + password change + email change)
- [ ] Verify `GET /api/auth/me` still returns updated fields (regression)
- [ ] Verify login with new password succeeds and old password fails (post-password-change)

## Success Criteria
- PATCH name → next `GET /api/auth/me` returns new name.
- PUT goals with non-existent subjectId → 400 with message identifying bad id.
- POST duplicate goal subjectId → 409.
- DELETE goal by subjectId → returned user array no longer contains it.
- `passwordHash` never appears in any response body (grep test).
- `PATCH /api/auth/password` with wrong currentPassword → 401; correct → 200; subsequent login with new password succeeds and old password fails.
- `PATCH /api/auth/password` with newPassword < 8 chars → 400.
- `PATCH /api/auth/email` with wrong password → 401; taken email → 409; success → 200 with updated `user.email` (no passwordHash leak); subsequent login uses new email.

## Risk Assessment
| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| `passwordHash` leak in response | M | H | `stripUser` wrapper on every response; add explicit `.select('-passwordHash')` on reads. |
| Mass-assignment via PATCH allowing `passwordHash`/`email` change | H | H | Zod whitelist (only `profile.*`), no spread of req.body into update. |
| Date parsing inconsistency | M | L | Accept ISO string, coerce to `new Date()` after Zod; reject invalid via custom refine. |
| Password change with reused/weak passwords | M | M | Min length 8 enforced via Zod. No history check (out of scope). User can re-use current as new — accept (KISS). |
| Email-change race: two users grab the same new email | L | M | Mongo unique index on `email` enforces atomicity at DB layer; second writer gets duplicate-key error → map to 409. |
| Active JWT survives password change | M | M | Tokens valid until expiry. Acceptable for MVP — document. Future: token-version field on User incremented on password change. |

## Security Considerations
- All routes `authMiddleware`. User can only edit own data — implicit via `req.user.userId`.
- Whitelist fields strictly: profile.name, profile.avatarUrl, profile.grade only. Reject extra keys.
- Never accept `passwordHash`, `email`, `_id` in body of `/api/users/me` (Zod strips). Email change is its own dedicated endpoint with password re-verification.
- Cap learningGoals at 10 (Zod) — abuse prevention.
- `currentLevel.weakTopics` not user-editable (no endpoint exposes it for write).
- Password change: bcrypt.compare against stored hash; never log either password value. Min 8 chars; no upper bound (bcrypt 72-byte truncation acceptable for MVP — document).
- Email change: requires fresh password proof to prevent session-hijack abuse. New email lowercased; uniqueness enforced via DB index + pre-check.
- Both credential endpoints: rate-limit candidate (out of scope for Week 4; flag for future middleware).

## Next Steps
- Phase 06: Swagger.
- Future: avatar upload (file → S3) — out of scope; PATCH accepts URL string only.
- Future: token versioning on password change to invalidate active sessions.
- Future: password reset flow via email (out of scope; this phase only covers self-initiated change).
- Future: rate-limiting middleware on credential endpoints.

## Rollback
- Remove `app.use('/api/users', ...)`. Reads via `/api/auth/me` continue working.
- Revert `auth.routes.ts` additions for `PATCH /password` and `PATCH /email`. `auth.service.ts` rollback removes `changePassword`/`changeEmail` methods.
- No data migration; existing user docs untouched. Already-changed passwords/emails persist (acceptable — they are valid user data).
