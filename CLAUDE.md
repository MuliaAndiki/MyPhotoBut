# CLAUDE.md — MyPhotoBut Engineering & Agent Playbook

This file provides guidance to Claude Code, Antigravity, and AI coding agents working in the **MyPhotoBut** monorepo.

---

## 1. Active Project Skills (`.agents/skills/`)

Before writing code or modifying UI, load the relevant skill from `.agents/skills/`:

1. **`anti-slop`** (`.agents/skills/anti-slop/SKILL.md`):
   - **Trigger**: Any UI, CSS, component, route, or Canvas styling task.
   - **Core Rule**: Strictly enforce the 2-theme system from `desain.png` (**Light `#FFFFFF`** & **Dark `#181818`**) with **Acid Lime (`#D8FF54`)** and **Electric Lavender (`#C575F8`)** solid blocks, `rounded-[20px]` action pill cards, circular `#181818` icon badges (`icon-badge-obsidian`), and **`"Parkinsans"`** typography. Ban all generic AI purple-to-cyan gradients, glassmorphism soup, and `Inter Tight`.
2. **`ponytail`** (`.agents/skills/ponytail/SKILL.md`):
   - **Trigger**: Full-stack feature development bridging `service/` (Go 1.25 Fiber v2 + GORM) and `web/` (TanStack Start + Cloudflare Workers).
   - **Core Rule**: Vertical-slice execution (`DTO -> Model -> Repo -> Service -> Handler -> Route` in Go, paired with `Zod Schema -> createServerFn BFF -> TanStack Query Hook -> Component` in React).
3. **`superpowers`** (`.agents/skills/superpowers/SKILL.md`):
   - **Trigger**: Multi-step implementation, debugging, architectural changes, and verification.
   - **Core Rule**: Spec-first reading (`docs/00`–`05`), contract verification, zero silent failures, and mandatory pre-completion typecheck/build verification.
4. **`graphify`** (`.agents/skills/graphify/SKILL.md`):
   - **Trigger**: Codebase architecture exploration, dependency impact analysis, or knowledge graph generation (`graphify-out/`).

---

## 2. Monorepo Structure & Specifications

Read the modular PRD in `docs/` before implementing features:
- `docs/00-OVERVIEW.md` — Product vision, 100% Guest Photobooth + Passwordless Creator Frame Ecosystem.
- `docs/01-USER-FLOW-UX.md` — Dual-theme design tokens (`desain.png` + `"Parkinsans"`), screen flows, and camera state machine.
- `docs/02-ARCHITECTURE.md` — BFF `createServerFn` security boundary, Direct-to-R2 Presigned PUT sequence diagrams, and `R2SessionCleanupWorker`.
- `docs/03-BACKEND-SPEC.md` — 4 Backend Modules (`auth`, `booth`, `template`, `worker` — 20 endpoints), PostgreSQL DDL migrations, GORM models, and DTO contracts.
- `docs/04-FRONTEND-SPEC.md` — `web/src/features/{auth,booth,template}`, `AppConfig`, SEO/LLM (`llms.txt`)/GEO (JSON-LD), and route definitions.
- `docs/05-CANVAS-ENGINE.md` — `getUserMedia`, `11:7.5` center-crop math, Safari/iOS-safe `getImageData` LUT pixel filters, and 300 DPI strip compositor.

---

## 3. Essential Commands

### Frontend (`web/`)
```bash
cd web
bun install
bun run dev              # Start Vite + Cloudflare Workers SSR dev server on :3000
bun run typecheck        # tsc --noEmit (MUST pass with 0 errors)
bun run lint             # ESLint check
bun run generate-routes  # Regenerate src/routeTree.gen.ts
```

### Backend (`service/`)
```bash
cd service
go mod tidy
go vet ./...             # Static analysis check
go test ./...            # Run unit tests
air                      # Live reload dev server on :8080 (or: go run ./cmd/api)
```

---

## 4. Critical Guardrails

- **Never leak `API_SECRET`**: Always read `process.env.API_SECRET` inside `.handler()` in `createServerFn`. Never place it in `VITE_*` variables.
- **Never use `ctx.filter`**: Always use `applyPixelFilterToImageData()` (`ctx.getImageData` + `Uint8Array(256)` LUT) so filters render identically on iOS Safari and Chrome.
- **Always use Standardized Go Response Envelope**: Every Fiber handler in `service/internal/handler/` must return via `utils.Success`, `utils.Created`, `utils.Error`, or `utils.ValidationError` (`service/pkg/utils/response.go`).
- **Always stop Camera Tracks**: Call `stream.getTracks().forEach(t => t.stop())` when leaving the capture stage or unmounting `/booth`.
