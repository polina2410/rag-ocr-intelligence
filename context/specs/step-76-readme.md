# Implementation Task: Project README — overview, architecture, Docker setup, RAG examples, screenshots

## What to build
A user-facing root `README.md` at the repository root that introduces ocr-intelligence, shows its architecture, gives copy-pasteable local setup instructions (Docker + pnpm), demonstrates example RAG queries against the `/ask` endpoint and UI, and embeds demo screenshots. This is the first user-facing document in the repo (CLAUDE.md is a contributor-only guide and stays separate).

## Current state
- **No root `README.md` exists.** Only `CLAUDE.md` (internal contributor guide) is present.
- `docker-compose.yml` (repo root): three services — `postgres` (image `postgres:16`, host port **5433**→5432), `qdrant` (image `qdrant/qdrant:v1.13.6`, bound **127.0.0.1:6333**), `redis` (image `redis:7-alpine`, port **6379**). Named volumes: `postgres_data`, `qdrant_data`, `redis_data`. Reads env vars `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `QDRANT_API_KEY` from root `.env`.
- `.env.example` (repo root): documents `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `QDRANT_API_KEY`, `REDIS_HOST`, `REDIS_PORT`. Does **NOT** currently list backend-only vars (`DB_HOST`, `DB_PORT`, `QDRANT_URL`, `OPENAI_API_KEY`, `CORS_ORIGIN`) that live in `apps/backend/.env`.
- Root `package.json`: `name: ocr-intelligence`, `packageManager: pnpm@10.33.0`, Turborepo (`turbo@^2.5.4`). Scripts: `dev`, `build`, `lint`, `typecheck`, `test` (all `turbo <task>`).
- `apps/backend/src/main.ts`: NestJS listens on `PORT ?? 3000`; Swagger UI mounted at **`/docs`**; no global route prefix; CORS origin defaults to `http://localhost:5173`.
- Frontend: Vite dev server on **:5173**, pages `/races`, `/races/:id`, `/ask`, `/upload`.
- Backend endpoints: `POST /ingest/csv`, `GET /races`, `GET /races/:id`, `GET /athletes`, `GET /athletes/:id`, `POST /ask` (SSE stream), `DELETE /races/:id`.
- Sample CSV fixtures: `apps/backend/test/fixtures/*.csv` (e.g. `Spartan_Sprint_Novi_Sad_2024.csv`).
- No `docs/` or `images/` asset folder currently exists.

## Deliverables (definition of done)
1. A new file `README.md` exists at the repository root.
2. **Title + one-paragraph overview** describing ocr-intelligence as an obstacle course race data platform with CSV ingestion, a RAG question-answering pipeline, and a React dashboard.
3. **Tech-stack section** listing accurate versions/components: React 19 + Vite + TypeScript, NestJS + TypeORM + PostgreSQL 16, Qdrant v1.13.6, Redis 7 + BullMQ, OpenAI (`text-embedding-3-small` + `gpt-4o-mini`), pnpm 10.33.0 + Turborepo.
4. **Architecture section** with a Mermaid `flowchart` block covering both data flows: (a) ingestion — CSV upload → backend parse → Postgres + BullMQ embed job → OpenAI embeddings → Qdrant; (b) query — `/ask` → retrieve top-5 from Qdrant → prompt builder → GPT-4o-mini → SSE stream → frontend chat. Frontend pages and three Docker services appear.
5. **Repository layout** subsection mapping `apps/frontend`, `apps/backend`, `packages/types` to one-line descriptions.
6. **Prerequisites** subsection listing: Docker + Docker Compose, Node.js (version confirmed from repo), pnpm 10.33.0, an OpenAI API key.
7. **Local setup instructions** as a numbered, copy-pasteable sequence: clone → cp `.env.example` `.env` and fill values → create `apps/backend/.env` with all backend vars enumerated explicitly → `pnpm install` → `docker compose up -d` → start backend and frontend.
8. **Service URLs table**: frontend `:5173`, backend API `:3000`, Swagger `/docs`, Postgres `:5433`, Qdrant `:6333`, Redis `:6379`.
9. **Environment-variables table** documenting every variable for both root `.env` and `apps/backend/.env`, which file each belongs to, and a one-line purpose. Secrets shown as placeholders only.
10. **Loading data** subsection: upload via the `/upload` UI page, plus a `curl` example for `POST /ingest/csv` using one of the fixture CSVs.
11. **Example RAG queries** subsection with at least 3 concrete natural-language questions, shown both as `/ask` UI usage and as a `curl` request to `POST /ask` (noting the SSE response).
12. **Demo screenshots**: at least 3 image embeds for the Races grid, the Race detail dashboard, and the Ask chat. Each has descriptive alt text and a relative path under `docs/`. If live screenshots cannot be produced, placeholder files must be committed at those paths so links resolve.
13. Every command block uses fenced code with a language tag (`bash`); all ports, URLs, paths, and filenames match the verified repo state.
14. No broken internal links; Mermaid block has valid syntax.

## Rules that must hold
- Do NOT modify `docker-compose.yml`, `.env.example`, or any source code — this is documentation-only.
- Never include real secrets or API keys — placeholders only.
- All facts (ports, image versions, endpoints, scripts, Swagger path) must match the actual repository.
- Screenshot image paths must point to files that actually exist — commit placeholder PNGs if live captures are not possible.
- Keep CLAUDE.md unchanged; README may link to it for contribution details.
- Markdown only; Mermaid for the diagram.
- Qdrant is bound to `127.0.0.1:6333` (loopback only) — reflect this accurately.
- Backend has no global route prefix — endpoints are at the root (`/ask`, not `/api/ask`).

## Build steps
1. Verify ground truth: re-read `docker-compose.yml`, root `package.json`, `apps/backend/src/main.ts`, `.env.example`, and `apps/backend/.env` key names. Confirm endpoint list from controllers. Confirm Node.js version requirement (check for `.nvmrc` or `engines` field).
2. Create `docs/` folder at repo root. Capture (or create placeholder) screenshots:
   - `docs/screenshot-races.png` — `/races` page with the parallax hero and race card grid
   - `docs/screenshot-race-detail.png` — `/races/:id` dashboard (charts + leaderboard)
   - `docs/screenshot-ask.png` — `/ask` chat page with a streamed response visible
3. Write `README.md` in this section order:
   - Title + overview
   - Tech stack
   - Architecture (Mermaid flowchart)
   - Repository layout
   - Prerequisites
   - Local setup (numbered steps)
   - Service URLs table
   - Environment variables table (both `.env` files)
   - Loading data (`/upload` UI + `curl POST /ingest/csv`)
   - Example RAG queries (UI + `curl POST /ask` with SSE note)
   - Demo screenshots (3 embeds from `docs/`)
   - Contributing (link to `CLAUDE.md`)
4. In the env table enumerate explicitly:
   - Root `.env`: `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `QDRANT_API_KEY`, `REDIS_HOST`, `REDIS_PORT`
   - `apps/backend/.env`: `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `QDRANT_URL`, `QDRANT_API_KEY`, `REDIS_HOST`, `REDIS_PORT`, `OPENAI_API_KEY`, `CORS_ORIGIN`
5. Write the Mermaid diagram. Example skeleton (expand with real node labels):
   ```
   flowchart LR
     subgraph docker["Docker Compose"]
       PG[(PostgreSQL :5433)]
       QD[(Qdrant :6333)]
       RD[(Redis :6379)]
     end
     subgraph frontend["Frontend :5173"]
       ...pages...
     end
     subgraph backend["Backend :3000"]
       ...services...
     end
   ```
6. Write `curl` examples for:
   - `POST /ingest/csv` — multipart, pointing at `apps/backend/test/fixtures/Spartan_Sprint_Novi_Sad_2024.csv`
   - `POST /ask` — JSON `{ "query": "Who won the Spartan Sprint Novi Sad 2024?" }`, note `text/event-stream` response
7. Proofread: verify all ports/URLs/commands; validate Mermaid syntax; confirm all `docs/` image paths exist.

## Notes for the implementer
- **Out of scope:** production/cloud deployment, CI/CD, full API reference (Swagger covers it), badges, changelog.
- **Files likely affected:** new `README.md` (repo root), new `docs/` folder with PNG screenshots. No existing source files edited.
- **Screenshots:** require a running, seeded app. If impossible in this environment, commit 1×1 transparent placeholder PNGs at the expected paths and note "Replace with live screenshots" in the README.
- **`.env.example` gap:** root `.env.example` is missing the backend-only vars. The README env table should document this gap clearly and tell readers to create `apps/backend/.env` separately. Updating `.env.example` itself is a separate out-of-scope change.

**Open questions (non-blocking):**
1. **Screenshots:** can live screenshots be captured from the running app, or are placeholders needed?
2. **Node.js version:** no `.nvmrc` or `engines` field confirmed — check `package.json` before stating a version.
3. **License:** no LICENSE file detected — confirm intended license or omit that section.
