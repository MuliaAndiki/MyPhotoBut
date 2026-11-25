---
name: graphify
description: >-
  Builds, updates, and queries the persistent architectural knowledge graph (graphify-out/)
  for the MyPhotoBut monorepo (docs/, service/, web/). Activate for any question about
  codebase architecture, cross-module relationships, god nodes, community detection,
  or impact analysis across Go Fiber endpoints, TanStack Start routes, and PRD specs.
---

# Graphify Knowledge Graph Skill (`MyPhotoBut`)

Use **Graphify** to map and query the relationships across `docs/` (modular PRD), `service/` (Go 1.25 Fiber v2 backend), and `web/` (TanStack Start + React 19 frontend).

---

## 1. Fast Path: Querying an Existing Graph

Before running a full extraction, check if `graphify-out/graph.json` exists in `/home/muliaandiki/project/myphotobut/graphify-out/graph.json`:

- **If `graphify-out/graph.json` exists**:
  - Use the Graphify MCP tools (`query_graph`, `get_node`, `get_neighbors`, `get_community`, `god_nodes`, `graph_stats`, `shortest_path`) or CLI immediately:
    ```bash
    graphify query "<question>"
    graphify path "<SourceNode>" "<TargetNode>"
    graphify explain "<NodeName>"
    ```

---

## 2. Building or Updating the Monorepo Knowledge Graph

When `graphify-out/graph.json` does not exist yet or after major architectural additions across `docs/`, `service/`, and `web/`:

1. **Incremental Update (after editing files)**:
   ```bash
   graphify . --update
   ```
2. **Full Pipeline Build**:
   - Follow the global `/graphify` pipeline (`/home/muliaandiki/.gemini/config/skills/graphify/SKILL.md`):
     - Step 1: Detect Python interpreter with `graphify` installed and write `graphify-out/.graphify_python`.
     - Step 2: Run `graphify.detect` on `/home/muliaandiki/project/myphotobut`.
     - Step 3: Run Part A (deterministic AST extraction on Go & TypeScript files in `service/` and `web/`) and Part B (semantic extraction on `docs/*.md`, `AGENTS.md`, `CLAUDE.md`) in parallel, then merge in Part C.
     - Step 4 & 5: Build graph, run community detection, label communities (e.g., `"Booth Canvas Engine"`, `"Go Fiber Auth & Templates"`, `"TanStack Start BFF & Routes"`, `"Dual-Theme Design System"`), and generate `graphify-out/GRAPH_REPORT.md` + `graphify-out/graph.json`.

---

## 3. Key Architectural Communities in `MyPhotoBut`

When analyzing or labeling nodes in this repository, track these core boundaries:
- **`docs/` (Specifications)**: `00-OVERVIEW.md` .. `05-CANVAS-ENGINE.md`
- **`service/` (Go Backend)**:
  - `Module A (auth)`: Magic Link, Google OAuth 2.0, JWT & Refresh Token rotation
  - `Module B (booth)`: Guest R2 Presign (`MORA-8X2A`), Session confirmation, Public Gallery
  - `Module C (template)`: Official & Community PNG overlay catalog, Creator upload, Admin moderation
  - `Module D (worker)`: `R2SessionCleanupWorker` (`internal/worker/cleanup.go`)
- **`web/` (TanStack Start Frontend)**:
  - `src/config/app.config.ts` & `src/lib/seo/index.ts` (AppConfig, Footer, SEO, LLM `llms.txt`, GEO JSON-LD)
  - `src/styles/globals.css` (Dual-theme `#181818` / `#FFFFFF` + `#D8FF54` / `#C575F8` + `"Parkinsans"`)
  - `src/features/{auth,booth,template}` (Zod schemas, `createServerFn` BFF, Canvas 2D pixel engine)
