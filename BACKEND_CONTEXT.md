# Darpan CMS Backend — Frontend Integration Context

Reference document for building the frontend that consumes this API.

## Base Info

- **Base URL (dev):** `http://localhost:5000`
- **API prefix:** `/api`
- **Swagger docs:** `http://localhost:5000/api-docs`
- **Health check:** `GET /health`
- **Auth scheme:** JWT Bearer token in `Authorization: Bearer <token>` header
- **Content type:** `application/json` for all requests/responses
- **CORS:** Allows origin `http://localhost:3000` with `credentials: true`. Allowed methods: `GET, POST, PUT, PATCH, DELETE, OPTIONS`. Allowed headers: `Content-Type, Authorization`.

## Rate Limits

| Scope | Window | Max requests | Response on limit |
|---|---|---|---|
| Global (all routes) | 15 min | 100 | 429 `{ error: "Too many requests, please try again later." }` |
| `/api/auth/*` | 1 min | 5 | 429 `{ error: "Too many authentication attempts, please try again later." }` |

Rate limit headers (`RateLimit-*`) are returned via the standard `standardHeaders` format. Handle 429 in the client (show toast, disable submit briefly).

## Roles

```ts
type Role = 'user' | 'superadmin';
```

- **user** — registers/logs in with mobile number + password. Read-only access to public resources.
- **superadmin** — registers/logs in with email + password. Can create/update/delete categories and series, and request S3 upload URLs.

## Auth Endpoints

All under `/api/auth`. None require a token.

### `POST /api/auth/register` — User register

Body:
```json
{ "mobileNumber": "8780951343", "password": "Passw0rd!" }
```
- `mobileNumber`: 10–15 digits, digits only
- `password`: 8–128 chars

Success `201`:
```json
{
  "token": "<jwt>",
  "user": { "id": "<mongoId>", "mobileNumber": "8780951343", "role": "user" }
}
```
Errors: `400` validation, `409` user exists.

### `POST /api/auth/login` — User login

Body: same as register. Success `200` with same shape. Errors: `400` validation, `401` invalid credentials.

### `POST /api/auth/superadmin/register` — Superadmin register

Body:
```json
{ "email": "admin@darpan.com", "password": "SuperSecret123!" }
```
Success `201`:
```json
{
  "token": "<jwt>",
  "user": { "id": "<mongoId>", "email": "admin@darpan.com", "role": "superadmin" }
}
```
Errors: `400` validation, `409` superadmin exists.

### `POST /api/auth/superadmin/login` — Superadmin login

Body: same as register. Success `200` with same shape. Errors: `400` validation, `401` invalid credentials.

## Category Endpoints

Under `/api/categories`.

### `GET /api/categories` — List all (public)

Response `200`:
```json
[
  {
    "_id": "<id>",
    "name": "Drama",
    "slug": "drama",
    "thumbnailUrl": "https://...",
    "createdAt": "...",
    "updatedAt": "..."
  }
]
```

### `GET /api/categories/:id` — Get one (public)

Response `200`: single category object. `404` if missing.

### `POST /api/categories` — Create (superadmin only)

Headers: `Authorization: Bearer <token>`

Body:
```json
{ "name": "Drama", "thumbnailUrl": "https://..." }
```
- `name`: 1–100 chars, must be unique (slug derived from name)
- `thumbnailUrl`: optional, valid URL

Success `201`: created category. Errors: `400` validation, `401/403` auth, `409` duplicate.

### `PATCH /api/categories/:id` — Update (superadmin only)

Body: partial — any subset of `{ name, thumbnailUrl }`. Returns updated category. `404` if missing.

### `DELETE /api/categories/:id` — Delete (superadmin only)

Response `200`: `{ "message": "Category deleted successfully" }`. `404` if missing.

## Series (Content) Endpoints

Under `/api/series`. A "series" contains an array of videos stored in S3.

### `POST /api/series/generate-upload-url` — Get presigned S3 upload URL (superadmin only)

Body:
```json
{ "fileName": "video.mp4", "fileType": "video/mp4" }
```
- `fileType` must match `video/*`

Response `200`:
```json
{
  "url": "https://s3...",
  "fields": { "...": "..." },
  "s3Key": "videos/<uuid>.mp4",
  "expiresIn": 900
}
```

**Upload flow:** POST a multipart form to `url` with all `fields` plus the `file` field (last). Keep the returned `s3Key` to send when creating/updating the series.

### `POST /api/series` — Create series (superadmin only)

Body:
```json
{
  "categoryId": "<categoryMongoId>",
  "title": "My Series",
  "description": "optional",
  "thumbnailUrl": "https://... (optional, valid URL)",
  "videos": [
    {
      "title": "Episode 1",
      "s3Key": "videos/<uuid>.mp4",
      "duration": 1234,
      "order": 0
    }
  ]
}
```
- `title`: 1–200 chars
- Each video: `title` (1–200), `s3Key`, `duration` (positive number), `order` (>= 0)

Success `201`: created series. Errors: `400` validation, `404` category not found.

### `GET /api/series/:id` — Get series with stream URLs (public)

Response `200`:
```json
{
  "_id": "...",
  "categoryId": { "_id": "...", "name": "...", "slug": "..." },
  "title": "...",
  "description": "...",
  "thumbnailUrl": "...",
  "videos": [
    {
      "_id": "...",
      "title": "Episode 1",
      "s3Key": "videos/...",
      "duration": 1234,
      "order": 0,
      "streamUrl": "https://s3-presigned... (expires in 1h)"
    }
  ],
  "createdAt": "...",
  "updatedAt": "..."
}
```
`streamUrl` is a presigned GET URL valid for 1 hour — use directly in `<video>` src.

### `PATCH /api/series/:id` — Update (superadmin only)

Partial body of the create shape. Returns updated series (without streamUrl regeneration; use GET to get fresh stream URLs).

### `DELETE /api/series/:id` — Delete (superadmin only)

Response `200`: `{ "message": "Series deleted successfully" }`.

## Error Response Format

All errors return:
```json
{ "error": "<message>" }
```

Common status codes:
- `400` validation failure (message is the first Zod issue)
- `401` missing/invalid token, or invalid credentials
- `403` superadmin route accessed as user
- `404` resource not found
- `409` duplicate (user/superadmin/category name collision)
- `429` rate limit exceeded
- `500` internal server error

## Suggested Frontend TypeScript Types

```ts
export type Role = 'user' | 'superadmin';

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    mobileNumber?: string;
    email?: string;
    role: Role;
  };
}

export interface Category {
  _id: string;
  name: string;
  slug: string;
  thumbnailUrl?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Video {
  _id?: string;
  title: string;
  s3Key: string;
  duration: number;
  order: number;
  streamUrl?: string; // only present on GET /api/series/:id
}

export interface Series {
  _id: string;
  categoryId: string | Category;
  title: string;
  description?: string | null;
  thumbnailUrl?: string | null;
  videos: Video[];
  createdAt: string;
  updatedAt: string;
}

export interface UploadUrlResponse {
  url: string;
  fields: Record<string, string>;
  s3Key: string;
  expiresIn: number;
}

export interface ApiError {
  error: string;
}
```

## Recommended Frontend Patterns

1. **Token storage:** Persist JWT (e.g., `localStorage` or HTTP-only cookie via your own proxy). Token expires in 7 days by default.
2. **Auth header:** Attach `Authorization: Bearer <token>` to every protected request. Centralize in an axios/fetch wrapper.
3. **401 handling:** On `401`, clear stored token and redirect to login.
4. **403 handling:** Show "Superadmin only" UI; hide superadmin actions when `user.role !== 'superadmin'`.
5. **Video upload flow:**
   1. Call `POST /api/series/generate-upload-url` with file name + type.
   2. Build a `FormData`: append every key/value from `fields`, then `file` last. POST to `url`.
   3. Save `s3Key` (plus client-side `duration` from a `<video>` metadata probe, and an `order`) into a `videos[]` entry.
   4. Call `POST /api/series` (or `PATCH`) with the series payload including `videos`.
6. **Streaming:** Always use a fresh `GET /api/series/:id` response — `streamUrl` is presigned and expires in 1 hour.
7. **Rate limits:** On `429`, surface the server message; auth screens should disable the submit button for ~60s.

## Login Page (frontend route `/login`)

Two flows depending on which form is shown:
- **User login** → `POST /api/auth/login` with `{ mobileNumber, password }`
- **Superadmin login** → `POST /api/auth/superadmin/login` with `{ email, password }`

Validation to mirror on the client:
- `mobileNumber`: 10–15 digits, digits only
- `email`: valid email
- `password`: 8–128 chars

On success store `token` + `user`, then redirect (e.g., `/` for users, `/admin` for superadmins).
