# Implementation Task: Step 77 — Backend Hardening (env example, OpenAI error handling, /ask rate limiting)

## What to build
Four loosely-coupled hardening tasks: create `apps/backend/.env.example` documenting every NestJS env var, confirm the text-serializer test suite (already complete), add resilient error handling + BullMQ retry config for the OpenAI embedding pipeline, and rate-limit `POST /ask` with `@nestjs/throttler` to prevent runaway OpenAI costs.

## Current state
- **Root `.env.example`** — documents Docker Compose vars only: `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `QDRANT_API_KEY`, `REDIS_HOST`, `REDIS_PORT`. No `apps/backend/.env.example` exists.
- **Backend env vars (verified)**: `apps/backend/src/openai/openai.module.ts` reads `OPENAI_API_KEY` via `config.getOrThrow`; `apps/backend/src/vector-store/vector-store.module.ts` reads `QDRANT_URL` (getOrThrow) and `QDRANT_API_KEY` (get); `apps/backend/src/app.module.ts` reads `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`; `apps/backend/src/queue/queue.module.ts` reads `REDIS_HOST`, `REDIS_PORT`; `apps/backend/src/main.ts` reads `CORS_ORIGIN` and optional `PORT`.
- **Serializer tests** — `apps/backend/src/serializer/race-result-serializer.service.spec.ts` exists, 14 passing tests covering all branches. ✅ No changes needed.
- **Embedding pipeline** — `EmbedService.embed(text)` and `EmbedService.batchEmbedRace(raceId)` have no try/catch; errors propagate raw to `EmbedProcessor.process()`. BullMQ job is enqueued with `await this.embedQueue.add(EMBED_JOB, { raceId })` — no `attempts` or `backoff` set, so the default is 0 retries (fail permanently on first error).
- **Rate limiting** — `@nestjs/throttler` is not installed. `POST /ask` has no guard. Every call triggers an OpenAI chat completion stream.
- **Backend deps** (confirmed): `@nestjs/bullmq`, `@nestjs/common`, `@nestjs/config`, `bullmq`, `openai`, `helmet` — no throttler package.
- **Test count**: 162 tests passing (last confirmed state).

## Deliverables (definition of done)
1. `apps/backend/.env.example` created with all 12 backend env vars (one per line, placeholder values, one-line comments). Vars: `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `QDRANT_URL`, `QDRANT_API_KEY`, `REDIS_HOST`, `REDIS_PORT`, `OPENAI_API_KEY`, `CORS_ORIGIN`, `PORT` (optional with default noted).
2. Root `.env.example` gains a header comment clarifying it covers Docker Compose only and points readers to `apps/backend/.env.example` for the NestJS process.
3. ✅ `race-result-serializer.service.spec.ts` — 14 tests already green. Verified by running `pnpm --filter backend test` with no new failures.
4. `EmbedService.batchEmbedRace` uses fail-fast strategy: an OpenAI error from any single `embed()` call throws immediately (no per-item catch), including the `raceId` in the error message for context. A new test in `embed.service.spec.ts` mocks `embed` to reject and asserts the batch propagates the error.
5. BullMQ embed jobs retry on transient failure: `registerQueue` in `queue.module.ts` adds `defaultJobOptions: { attempts: EMBED_JOB_ATTEMPTS, backoff: { type: 'exponential', delay: EMBED_BACKOFF_DELAY_MS } }` with named constants (`EMBED_JOB_ATTEMPTS = 3`, `EMBED_BACKOFF_DELAY_MS = 2000`). `ingestion.service.spec.ts` updated to assert the enqueued job is created (already tested) — no extra assertion needed for job options since they come from the queue config, not the `add` call.
6. `@nestjs/throttler` installed. `ThrottlerModule` registered in `AskModule` (scoped to `/ask` only — not global). `ThrottlerGuard` applied to `AskController` via `@UseGuards`. Named constants `ASK_THROTTLE_TTL_MS` and `ASK_THROTTLE_LIMIT` set to 60 000 ms and 10 requests respectively. Exceeding the limit returns HTTP `429` before any SSE headers are written.
7. `ask.controller.spec.ts` extended with a test that mocks `ThrottlerGuard` as rejecting and asserts `POST /ask` returns 429 without calling `retrieve`.
8. `pnpm --filter backend lint` passes (0 errors). `pnpm --filter backend test` passes (all existing + new tests).

## Rules that must hold
- No `any` types — use `unknown` or proper generics.
- OpenAI error handling stays inside `EmbedService` — do not add try/catch in `EmbedProcessor` or controllers.
- Named constants for all numeric values (retry count, backoff delay, throttle TTL, throttle limit).
- Rate limiting scoped to `AskModule`/`AskController` only — do not apply a global guard that throttles ingestion or list endpoints.
- No real secrets in any `.env.example` — placeholders only.
- Do not modify the root `.env.example` vars list — only add the header comment.
- `apps/backend/.env` (the real file) is gitignored; never commit it.
- `pnpm --filter backend test` must stay green throughout.

## Build steps
1. Create `apps/backend/.env.example` with all 12 vars (deliverable 1). Use `DB_PORT=5433` to match the Docker Compose port mapping and note the default-5432 divergence.
2. Add a header comment to root `.env.example` (deliverable 2): one line saying "Docker Compose only — see apps/backend/.env.example for NestJS process variables".
3. Run `pnpm --filter backend test` to verify the serializer suite is still green (deliverable 3). ✅
4. Edit `apps/backend/src/embed/embed.service.ts` — in `batchEmbedRace`, wrap the loop body so that if `this.embed(chunk)` rejects, the caught error is re-thrown with `raceId` context (deliverable 4). Add named constant for the context prefix string if desired, or just use a template literal.
5. Edit `apps/backend/src/embed/embed.service.spec.ts` — add a test in a new `describe('batchEmbedRace - OpenAI failure')` block: mock `embed` to reject on the second call, assert `batchEmbedRace` rejects and no `vectorStore.upsert` is called (deliverable 4 test).
6. Edit `apps/backend/src/queue/queue.module.ts` — add `defaultJobOptions` to `registerQueue({ name: EMBED_QUEUE, defaultJobOptions: { attempts: EMBED_JOB_ATTEMPTS, backoff: { type: 'exponential', delay: EMBED_BACKOFF_DELAY_MS } } })`. Define `EMBED_JOB_ATTEMPTS = 3` and `EMBED_BACKOFF_DELAY_MS = 2000` as named constants at the top of the file or in `queue.constants.ts` (deliverable 5).
7. Install `@nestjs/throttler`: `pnpm --filter backend add @nestjs/throttler`.
8. Create `apps/backend/src/ask/ask-throttle.constants.ts` with `ASK_THROTTLE_TTL_MS = 60_000` and `ASK_THROTTLE_LIMIT = 10`.
9. Edit `apps/backend/src/ask/ask.module.ts` — import `ThrottlerModule.forRoot([{ ttl: ASK_THROTTLE_TTL_MS, limit: ASK_THROTTLE_LIMIT }])`. Confirm exact `ThrottlerModule` API via Context7 (the API changed between v4 and v5 — use the installed version's syntax).
10. Edit `apps/backend/src/ask/ask.controller.ts` — add `@UseGuards(ThrottlerGuard)` on the class or `@Post()` method (deliverable 6).
11. Edit `apps/backend/src/ask/ask.controller.spec.ts` — add a test overriding `ThrottlerGuard` to throw `ThrottlerException` and assert 429 (deliverable 7).
12. Run `pnpm --filter backend lint` and `pnpm --filter backend test` (deliverable 8). Fix any errors.

## Notes for the implementer
- **Throttler API version**: `@nestjs/throttler` v5+ changed the config shape. Run `pnpm --filter backend add @nestjs/throttler` first, then check the installed version and fetch docs via Context7 with `@nestjs/throttler` as the library ID before wiring. The `forRoot` array syntax (`[{ ttl, limit }]`) is v4+ style but `ttl` units changed from seconds to milliseconds in v5.
- **Fail-fast rationale**: `batchEmbedRace` calls `embed()` sequentially — if result #7 of 22 fails, results 1–6 have already been embedded. On BullMQ retry, those 6 get re-embedded (idempotent since Qdrant uses UUID-based upsert). Accumulate-and-continue would be more efficient but adds complexity with no clear winner — fail-fast chosen for simplicity.
- **SSE and 429**: `ThrottlerGuard` is an NestJS guard and runs before the controller body executes. The response is not committed (no SSE headers written) at guard time, so a 429 is a clean JSON error response, not an SSE stream — the spec's SSE concern does not apply.
- **`DB_PORT` mismatch**: `app.module.ts` defaults to 5432 but the Docker mapping is 5433. Document this explicitly in `apps/backend/.env.example` with a comment.
- **Files likely affected**: `apps/backend/.env.example` (new), `.env.example` (root, header only), `apps/backend/src/embed/embed.service.ts`, `apps/backend/src/embed/embed.service.spec.ts`, `apps/backend/src/queue/queue.module.ts`, `apps/backend/src/queue/queue.constants.ts` (or new constants file), `apps/backend/src/ask/ask.module.ts`, `apps/backend/src/ask/ask.controller.ts`, `apps/backend/src/ask/ask-throttle.constants.ts` (new), `apps/backend/src/ask/ask.controller.spec.ts`, `apps/backend/package.json`.
- **Out of scope**: GenerateService retry logic, circuit-breaker for Qdrant, frontend changes, global rate limiting, changing model names or embedding strategy.
