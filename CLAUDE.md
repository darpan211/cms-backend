# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

| Command | Purpose |
|---|---|
| `npm run dev` | Start API on port 5000 with hot reload (`tsx watch src/app.ts`) |
| `npm run build` | Compile TS → `dist/` (runs `npm run clean` first via `prebuild`) |
| `npm start` | Run compiled server from `dist/` |
| `npm run type-check` | `tsc --noEmit` — also runs in the pre-commit hook |
| `npm run lint` / `npm run lint:check` | ESLint with/without auto-fix (only `.ts` files; `*.js` is ignored) |
| `npm run format` / `npm run format:check` | Prettier write/check |

No test runner is configured — `npm test` is a placeholder. Don't claim test coverage; if tests are needed, propose the framework first.

Engines pin `node >24.0.0` and `npm >10.0.0` — older Node will fail.

## Architecture

Single Express app, MongoDB via Mongoose, JWT auth, presigned URLs for video storage. Layered: `routes → controllers → models/services`. Entry point: [src/app.ts](src/app.ts).

### Request lifecycle (non-obvious bits)

- **Two-stage rate limiting in [src/app.ts](src/app.ts):** the auth limiter (5/min) is mounted on `/api/auth` *before* `app.use(globalLimiter)` (100/15min) — order matters, don't reorder. Both limiters skip when `NODE_ENV !== 'production'`, so local 429s won't reproduce.
- **Errors:** controllers wrap async handlers in `asyncHandler` from [src/utils/errors.ts](src/utils/errors.ts) and throw `AppError(status, msg)`. The global handler in [src/middlewares/errorHandler.ts](src/middlewares/errorHandler.ts) is the only place that formats error JSON — unknown errors become a generic 500. Never `res.status(...).json(...)` an error directly from a controller; throw `AppError` instead so the shape stays consistent.
- **Validation:** all input is parsed with Zod schemas in [src/schemas/validation.ts](src/schemas/validation.ts) using `.safeParse(...)`. The convention is `throw new AppError(400, parsed.error.issues[0]?.message || 'Validation failed')` — only the *first* issue is surfaced to clients.
- **Auth middleware:** [src/middlewares/auth.ts](src/middlewares/auth.ts) exports `authMiddleware` (verifies Bearer JWT, attaches `req.user: JWTPayload`) and `superadminMiddleware` (must run after `authMiddleware`). Protected routes apply them in that order, e.g. [src/routes/series.ts:19](src/routes/series.ts#L19).

### Domain model

The two roles live in **separate collections** — split was done so the user collection can grow subscription/billing fields without touching the tiny superadmin set.

- [src/models/User.ts](src/models/User.ts) — normal users. Identified by `mobileNumber` (10–15 digits, required + unique). Has `role: 'user'` (enum-locked single value, defaulted).
- [src/models/Superadmin.ts](src/models/Superadmin.ts) — superadmins. Identified by `email` (required + unique, lowercased). Has `role: 'superadmin'` (enum-locked single value, defaulted).
- Both models: `password` has `select: false` — you **must** `.select('+password')` to load it (see auth controller logins). `pre('save')` hashes the password; never hash manually. Both expose `comparePassword(candidate)`.
- The `role` field is stored on each document (not just on the JWT) so login/register responses can include it without the controller hardcoding a constant. Don't remove it — frontend consumes `user.role` from the auth response.
- JWT payload still carries `role` ([src/utils/jwt.ts](src/utils/jwt.ts)) so `superadminMiddleware` can authorize without a DB hit.

`Content` ([src/models/Content.ts](src/models/Content.ts)) backs the `/api/series` routes — **the Mongoose model is named `Content` but the route/feature is "Series"**. Each `Content` document embeds a `videos: IVideo[]` subdocument array (each with its own `_id`, `s3Key`, `order`, optional per-video `thumbnailUrl`). Series-level `thumbnailUrl` and per-video `thumbnailUrl` are independent.

`Content.createdBy` and `Category.createdBy` both `ref: 'Superadmin'` — only superadmins create content, so populating these gives a `Superadmin` doc, not a `User`.

### Object storage (read this before touching uploads)

[src/services/s3.ts](src/services/s3.ts) uses the AWS SDK but **the client in [src/config/aws.ts](src/config/aws.ts) is configured for Digital Ocean Spaces** (`DO_SPACES_ENDPOINT`, `DO_SPACES_KEY/SECRET`, `DO_SPACES_BUCKET`). The `S3_BUCKET` constant ([src/constants/index.ts:6](src/constants/index.ts#L6)) prefers `DO_SPACES_BUCKET` and falls back to `S3_BUCKET`. The AWS-named env vars in `.env.example` are not wired up.

`S3Service.generateUploadUrl` returns a **presigned PUT URL** (not a POST policy with `fields`). The client uploads with `PUT` directly to `url`. [BACKEND_CONTEXT.md](BACKEND_CONTEXT.md) still documents the old POST+fields shape — treat the code as the source of truth.

Stored keys go under `uploads/<timestamp>-<filename>`. On series delete, the controller batches `series.thumbnailUrl` plus every video's `s3Key` and `thumbnailUrl` into `S3Service.deleteObjects` before deleting the Mongo doc.

### TypeScript / ESM conventions

`tsconfig.json` uses `module: nodenext` with the strict suite plus `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noImplicitOverride`, `noUnusedLocals/Parameters`, and `noPropertyAccessFromIndexSignature`. Two consequences worth remembering:

- **Relative imports must include the `.js` extension** even when importing a `.ts` file (e.g. `import { S3Service } from '../services/s3.js'`). This is required by NodeNext ESM resolution.
- **Read env vars as `process.env['KEY']`**, not `process.env.KEY` — `noPropertyAccessFromIndexSignature` rejects the dot form.
- `exactOptionalPropertyTypes` means optional fields cannot accept `undefined` explicitly; controllers use conditional spreads like `...(description && { description })` rather than passing `description: undefined`.

ESLint enforces `@typescript-eslint/consistent-type-imports` (use `import type { ... }`).

### Git hooks

Husky runs on commit:
- **pre-commit:** `lint-staged` (eslint --fix + prettier --write on staged `.ts`) and `npm run type-check`. Type errors block the commit.
- **commit-msg:** validates Conventional Commits format (`feat(scope): subject`, `fix(...)`, `chore(...)`, etc.). Required by repo convention; recent history uses scoped types heavily.

## Config & docs

- `.env.example` lists every supported var. For storage, only the `DO_SPACES_*` block is currently consumed; the `AWS_*` block is unused.
- Swagger UI is served at `/api-docs`; JSDoc `@swagger` comments on controllers feed it via [src/config/swagger.ts](src/config/swagger.ts).
- [BACKEND_CONTEXT.md](BACKEND_CONTEXT.md) is a frontend-facing API reference. It's a useful overview but has drifted — the upload URL shape and "S3" naming no longer match the code. Verify against controllers before quoting it to the user.
