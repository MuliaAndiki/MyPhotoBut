---
name: superpowers
description: >-
  Disciplined engineering workflow for complex tasks in MyPhotoBut: spec-first alignment,
  contract-driven TDD, root-cause debugging, parallel execution, and mandatory verification
  before completion. Activate when planning multi-file features, debugging runtime/SSR errors,
  or orchestrating changes across docs/, service/, and web/.
---

# Superpowers Engineering Workflow Skill (`MyPhotoBut`)

This skill enforces high-leverage engineering habits so complex features and bug fixes succeed on the first pass without regressions.

---

## 1. Spec-First Alignment (`docs/00` – `05`)

Before writing or modifying implementation code:
1. Check the authoritative specification in `docs/`:
   - Product & Scope: [docs/00-OVERVIEW.md](file:///home/muliaandiki/project/myphotobut/docs/00-OVERVIEW.md)
   - UX, State Machine & 2-Theme Tokens: [docs/01-USER-FLOW-UX.md](file:///home/muliaandiki/project/myphotobut/docs/01-USER-FLOW-UX.md)
   - Architecture & R2 Sequence Flows: [docs/02-ARCHITECTURE.md](file:///home/muliaandiki/project/myphotobut/docs/02-ARCHITECTURE.md)
   - Go Fiber 20 Endpoints & DB Schema: [docs/03-BACKEND-SPEC.md](file:///home/muliaandiki/project/myphotobut/docs/03-BACKEND-SPEC.md)
   - TanStack Start Routes, BFF & SEO/GEO: [docs/04-FRONTEND-SPEC.md](file:///home/muliaandiki/project/myphotobut/docs/04-FRONTEND-SPEC.md)
   - Canvas Center-Crop & Safari-Safe Filters: [docs/05-CANVAS-ENGINE.md](file:///home/muliaandiki/project/myphotobut/docs/05-CANVAS-ENGINE.md)
2. Keep documentation and implementation synchronized whenever contracts evolve.

---

## 2. Root-Cause Debugging Protocol (No Guesswork)

When encountering a build, SSR, Worker, or Go runtime error:
1. **Read the Exact Stack Trace & Reproduction**:
   - Inspect the exact failing module, line number, and environment (`vite (ssr)` vs client browser vs Go Fiber).
2. **Check All Sibling Files for the Same Pattern**:
   - Example: If one `shadcn/ui` component has a broken import (`from 'cn'`), grep the entire directory (`grep -rn "from 'cn'" web/src/`) and fix all occurrences in a single batched turn.
3. **Verify the Fix with the Real Tooling**:
   - Never assume an edit fixed the issue without running `bun run typecheck` (for `web/`) or `go vet ./...` / `go test ./...` (for `service/`).

---

## 3. High-Efficiency Batched Execution

- **Batch Reads & Searches**: Issue all independent `read_file` and `run_command` search calls in parallel in the same turn.
- **Batch Edits & Writes**: Apply all independent file creations and edits in a single turn, then verify once after the last edit.
- **Hardware & Memory Hygiene**:
  - In `/booth`, verify `MediaStreamTrack.stop()` is called on stage transition (`CAPTURE` -> `STUDIO_EDIT`) and on component unmount.
  - Revoke temporary object URLs (`URL.revokeObjectURL`) when retaking photos.

---

## 4. Verification Before Completion Gate

Never claim a task is complete until:
- [ ] All TypeScript types pass: `cd web && bun run typecheck` exits with `0`.
- [ ] All Go packages compile cleanly: `cd service && go vet ./...` exits with `0`.
- [ ] UI components obey `.agents/skills/anti-slop/SKILL.md` (`"Parkinsans"` font, `#181818` / `#FFFFFF` / `#D8FF54` / `#C575F8` tokens).
