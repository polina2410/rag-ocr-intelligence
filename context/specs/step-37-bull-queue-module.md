# Implementation Task: BullMQ Queue Module with Redis Connection (Step 37)

## What to build
Stand up the queue **infrastructure** for the backend: add a Redis service to Docker Compose, install `@nestjs/bullmq` + `bullmq`, and create a dedicated `QueueModule` that configures the BullMQ root connection from `ConfigService` and registers one named queue (`EMBED_QUEUE`) so it is injectable by later steps. This step builds NO job processor (step 38) and does NOT wire ingestion to enqueue jobs (step 39).

## Current state
- `docker-compose.yml`: has `postgres` (host `5433`→`5432`, `container_name: ocr_postgres`) and `qdrant` (`127.0.0.1:6333`→`6333`, `ocr_qdrant`); top-level `volumes` = `postgres_data`, `qdrant_data`. **No `redis` service.** Compose interpolates env from the **repo-root** env file (`DB_USER`, `DB_PASSWORD`, `DB_NAME`, `QDRANT_API_KEY`).
- `apps/backend/package.json`: NestJS 11 (`@nestjs/common`/`core`/`platform-express` `^11.0.1`, `@nestjs/config@^4.0.4`, `@nestjs/typeorm@^11.0.1`, `@nestjs/swagger@^11.4.4`). **No `bull`, `bullmq`, `@nestjs/bull`, `@nestjs/bullmq`, `ioredis`, or `redis`.** Jest configured with `moduleNameMapper` stripping `.js` (ESM-style imports).
- `apps/backend/src/app.module.ts`: `ConfigModule.forRoot({ isGlobal: true })` + `TypeOrmModule.forRootAsync` (inject `ConfigService`, reads `DB_HOST`/`DB_PORT`/`DB_USER`/`DB_PASSWORD`/`DB_NAME`, coerces port via `Number(...)`). Feature modules imported with `.js` relative specifiers. **This is the exact `forRootAsync` pattern to mirror for `BullModule`.**
- Env surfaces: **two** files exist.
  - Repo root `.env.example` (tracked) — used by docker-compose; currently only `DB_USER`/`DB_PASSWORD`/`DB_NAME`/`QDRANT_API_KEY`.
  - `apps/backend/.env` (untracked, real) — what the NestJS app reads at runtime (`DB_HOST`, `DB_PORT`, etc.). **There is no `apps/backend/.env.example`.**
- Eventual consumer: `EmbedService.batchEmbedRace(raceId: string): Promise<void>` (step 31 ✅). Step-38 processor will call it; step-39 producer (IngestionService) will enqueue a job carrying a `raceId`. Nothing to build for those here.
- Nothing in this step is already implemented (no ✅ deliverables).

## Deliverables (definition of done)
1. **`redis` service** added to `docker-compose.yml`:
   - `image: redis:7-alpine`, `container_name: ocr_redis`.
   - Host port mapping `6379:6379` (propose) — if `6379` is taken locally, use `6380:6379` and set `REDIS_PORT=6380` to match (mirrors the Postgres `5433` remap precedent).
   - Volume `redis_data:/data`.
   - `redis_data` added to the **top-level `volumes:`** block (alongside `postgres_data`, `qdrant_data`).
2. **Dependencies installed** into the backend workspace:
   - Command: `pnpm --filter backend add @nestjs/bullmq bullmq`
   - Result is verifiable in `apps/backend/package.json` `dependencies` (versions must be compatible with NestJS 11 — `@nestjs/bullmq@^11.x`; `bullmq` latest stable). `ioredis` arrives transitively via `bullmq` — do not add it explicitly unless a build/type error requires it.
3. **Env vars documented** with expected local values:
   - `REDIS_HOST=localhost`
   - `REDIS_PORT=6379` (or `6380` if the conflict-averse mapping is chosen)
   - Add `REDIS_HOST`/`REDIS_PORT` to the **repo-root `.env.example`** (tracked), under a `# Redis` heading.
   - Add the same vars to the developer's real **`apps/backend/.env`** so the app boots (this file is untracked — never commit it). Since no `apps/backend/.env.example` exists, do NOT create one in this step; just document the two vars in this spec and in the root `.env.example`.
4. **`apps/backend/src/queue/queue.constants.ts`** — named export `export const EMBED_QUEUE = 'race-embed';` (no magic string elsewhere).
5. **`apps/backend/src/queue/queue.module.ts`** — `QueueModule` (named export) that:
   - Calls `BullModule.forRootAsync({ imports: [ConfigModule], inject: [ConfigService], useFactory: (config) => ({ connection: { host: config.getOrThrow<string>('REDIS_HOST'), port: Number(config.getOrThrow<string>('REDIS_PORT')) } }) })`.
   - Calls `BullModule.registerQueue({ name: EMBED_QUEUE })`.
   - `exports: [BullModule]` so importers get the registered `Queue`.
   - Imports `EMBED_QUEUE` from `./queue.constants.js`.
6. **`QueueModule` registered once** in `app.module.ts` `imports` (specifier `./queue/queue.module.js`). Existing TypeORM/feature-module imports remain untouched.
7. **Verification gates all pass:**
   - `pnpm --filter backend build` succeeds.
   - `pnpm --filter backend lint` passes (no new errors).
   - `pnpm --filter backend test` — existing **145** tests still pass (no new test required; this is pure DI/connection wiring).
   - Manual boot check: with `docker compose up -d` running (Redis up), `pnpm --filter backend start:dev` boots with no unhandled connection errors and the app reaches "Nest application successfully started".
8. **Explicit scope statement** honored: NO processor / `WorkerHost` (step 38) and NO ingestion enqueue (step 39) added in this step.

## Rules that must hold
- TypeScript only — no `any`; use the typed `getOrThrow<string>` overloads.
- **Named exports** for `QueueModule` and `EMBED_QUEUE`.
- **ESM `.js` relative import specifiers** (e.g. `./queue.constants.js`, `./queue/queue.module.js`) — match existing convention.
- NestJS module structure (module file under `src/queue/`).
- **No magic strings/numbers**: queue name is the `EMBED_QUEUE` constant; `REDIS_PORT` coerced with `Number(...)`; connection values via `ConfigService.getOrThrow` (fail-fast if missing).
- BullMQ uses a `connection` object (ioredis options) — **NOT** Bull's legacy `redis` key.
- `BullModule.forRootAsync` must run **exactly once** — only `QueueModule` calls it, and `QueueModule` is imported once in `AppModule`. Steps 38/39 import `QueueModule` (Nest singletons it) rather than calling `forRoot*` again.
- Never commit secrets or the real `apps/backend/.env`; only placeholder/example values in the tracked `.env.example`.
- Do not break existing boot — TypeORM, Qdrant, OpenAI, and all feature modules must continue to load.

## Build steps
1. Add the `redis` service + `redis_data` volume to `docker-compose.yml` (per Deliverable 1). Run `docker compose up -d` and confirm `ocr_redis` is healthy/listening.
2. Install deps: `pnpm --filter backend add @nestjs/bullmq bullmq`.
3. Add `REDIS_HOST` / `REDIS_PORT` to root `.env.example` and to the local `apps/backend/.env`.
4. Create `apps/backend/src/queue/queue.constants.ts` with `EMBED_QUEUE`.
5. Create `apps/backend/src/queue/queue.module.ts` (`forRootAsync` connection from `ConfigService` + `registerQueue({ name: EMBED_QUEUE })` + `exports: [BullModule]`).
6. Import `QueueModule` in `app.module.ts` (`./queue/queue.module.js`).
7. Run the verification gates: `build`, `lint`, `test` (145 pass), then manual `start:dev` boot with Redis running.

## Notes for the implementer
- **Out of scope:** job processor / `WorkerHost` + `@Processor` (step 38); wiring CSV ingestion to enqueue (step 39); job payload schema beyond "carries a `raceId`"; retries/backoff/concurrency tuning; dead-letter handling; Bull Board / monitoring UI; graceful-shutdown specifics.
- **Files likely affected/created:** `docker-compose.yml`; `apps/backend/package.json` (+lockfile); root `.env.example`; `apps/backend/.env` (local, untracked); NEW `apps/backend/src/queue/queue.constants.ts`; NEW `apps/backend/src/queue/queue.module.ts`; `apps/backend/src/app.module.ts`.
- **BullMQ vs Bull (FINAL):** use `@nestjs/bullmq` + `bullmq` only. `BullModule` is re-exported from `@nestjs/bullmq`; the `Queue`/`Job`/`Worker`/`WorkerHost` *types* come from `bullmq`. Do not install `@nestjs/bull`/`bull`.
- **Context7 caveat:** Context7 docs were unavailable when this spec was written. The `forRootAsync({ connection: {...} })` and `registerQueue({ name })` shapes are the stable documented BullMQ + Nest 11 pattern, but the implementer should confirm exact option names against `@nestjs/bullmq` types if anything fails to compile (notably the `connection` key vs any wrapper option).
- **Two env surfaces gotcha:** docker-compose interpolates from the **repo-root** env file; the Nest app reads **`apps/backend/.env`**. `REDIS_HOST`/`REDIS_PORT` are consumed by the *app*, so they must live in `apps/backend/.env`. Redis itself needs no env to start. Adding them to the root `.env.example` is for documentation/visibility.
- **Port conflict:** propose `6379:6379`; if the dev's local Redis already uses 6379, switch to `6380:6379` and set `REDIS_PORT=6380` so the in-container port stays 6379 while the host port differs (same trick Postgres uses with 5433).
- **What 38/39 will add (keep compatible, build nothing):** step 38 = a `@Processor(EMBED_QUEUE)` class extending `WorkerHost` whose handler calls `EmbedService.batchEmbedRace(raceId)`; step 39 = a producer that `@InjectQueue(EMBED_QUEUE)`s the `Queue` and calls `.add(...)` with a `{ raceId }` payload. Keeping the queue name in `EMBED_QUEUE` and exporting `BullModule` from `QueueModule` is what lets both fit without re-running `forRoot`.
- **Why no unit test:** this is DI + external-connection wiring; a unit test would only mock the connection and assert nothing meaningful. The manual `start:dev` boot against a running Redis is the real check. Keeping the existing 145 tests green proves no regression.