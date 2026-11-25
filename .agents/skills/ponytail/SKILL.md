---
name: ponytail
description: >-
  Fast, disciplined full-stack vertical-slice workflow for the MyPhotoBut monorepo
  bridging boilerpad-go-service (Go 1.25 + Fiber v2 + GORM + Neon Postgres + Cloudflare R2)
  and boilerpad-tanstack-start (React 19 + TanStack Start createServerFn BFF + TanStack Query
  + Zod v4 on Cloudflare Workers). Activate whenever adding or modifying API endpoints,
  database schemas, R2 presigned uploads, or BFF server functions.
---

# Ponytail Full-Stack Workflow Skill (`MyPhotoBut`)

**Ponytail** keeps full-stack execution tied together in a clean, single-direction vertical slice from PostgreSQL & Go Fiber all the way to TanStack Start Server Functions and React 19 UI—with zero drift between backend DTOs and frontend Zod schemas.

---

## 1. The Golden Vertical-Slice Order

Whenever building or updating a feature across `service/` and `web/`, execute in this exact order:

```text
[1. SQL Migration & GORM Model]  (service/migrations/ & service/internal/models/)
              ↓
[2. Go DTO with Validator Tags]  (service/internal/dto/)
              ↓
[3. Repository -> Service -> Handler -> Route]  (service/internal/{repository,service,handler,routes}/)
              ↓
[4. Matching Zod v4 Schema]      (web/src/features/<module>/schemas/)
              ↓
[5. TanStack createServerFn BFF] (web/src/features/<module>/server/)
              ↓
[6. Query / Mutation Hook & UI]  (web/src/features/<module>/{queries,hooks,components}/)
```

---

## 2. Backend Rules (`service/` — Go 1.25 + Fiber v2)

1. **Standardized Response Envelope (`pkg/utils/response.go`)**:
   - Handlers **NEVER** construct ad-hoc `c.JSON(fiber.Map{...})`.
   - Always return via:
     - `utils.Success(c, "message", data)` (`200 OK`)
     - `utils.Created(c, "message", data)` (`201 Created`)
     - `utils.Error(c, statusCode, "message", err)` (`4xx` / `5xx`)
     - `utils.ValidationError(c, details)` (`422 Unprocessable Entity` from `utils.ValidateStruct(req)`)
2. **Authentication & Authorization**:
   - All `/api/v1/*` routes sit behind `middleware.APISecret(cfg.APISecret)`.
   - Module `booth` (`/api/v1/booth/*`) requires **only** `X-API-SECRET` (100% Guest / Zero-Login).
   - Creator write routes require `middleware.JWTAuth(cfg.JWTSecret)` and read caller ID via `c.Locals(middleware.LocalsUserID).(uuid.UUID)`.
   - Admin moderation routes require `middleware.JWTAuth(cfg.JWTSecret)` + `middleware.RequireRoles("admin")`.
3. **Route Ordering Pitfall**:
   - Static sub-routes like `GET /api/v1/templates/me` **MUST** be registered before parameterized routes like `GET /api/v1/templates/:id`.

---

## 3. Edge BFF & Frontend Rules (`web/` — TanStack Start)

1. **Per-Request Secret Injection in `createServerFn`**:
   - Never access `process.env.API_SECRET` at module top-level.
   - Always use `goServiceFetch<T>()` inside `.handler()` so `process.env.API_SECRET` is read per-request on Cloudflare Workers and attached as `X-API-SECRET`.
2. **Direct-to-R2 Upload Pipeline**:
   - Never pass `File` or `Blob` payloads into `createServerFn`.
   - Step 1: Call `presignBoothUploadFn` (`POST /api/v1/booth/presign`) or `presignTemplateFn` (`POST /api/v1/templates/presign`).
   - Step 2: Browser executes `fetch(uploadUrl, { method: 'PUT', body: blob, headers: { 'Content-Type': blob.type } })` directly to Cloudflare R2.
   - Step 3: Call `createBoothSessionFn` (`POST /api/v1/booth/sessions`) or `createTemplateFn` (`POST /api/v1/templates`).
3. **SSR vs Client-Only Routes**:
   - `/booth` -> `ssr: false` (Webcam + Canvas 2D studio).
   - `/s/$shareCode` -> SSR enabled (`loader` + dynamic `head` with `og:image` for social preview).

---

## 4. Verification Gate

After completing a vertical slice, run both checks in one turn:
```bash
cd /home/muliaandiki/project/myphotobut/service && go vet ./... && go test ./...
cd /home/muliaandiki/project/myphotobut/web && bun run typecheck
```
