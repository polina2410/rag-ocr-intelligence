# Implementation Task: BullMQ Embed Job Processor (Worker)

## What to build
A BullMQ worker (`EmbedProcessor`) for the `race-embed` queue that runs the embedding pipeline in the background. The worker consumes `EmbedJobData` jobs and calls `EmbedService.batchEmbedRace(raceId)`. This step delivers the **consumer only** — no producer/enqueue wiring, and the existing synchronous embed call in `IngestionService` stays in place (that is step 39).

## Current state
- ✅ `apps/backend/src/queue/queue.constants.ts` — `export const EMBED_QUEUE = 'race-embed';`
- ✅ `apps/backend/src/queue/queue.module.ts` — `QueueModule`: `BullModule.forRootAsync` (Redis connection from `ConfigService` via `REDIS_HOST`/`REDIS_PORT`) + `BullModule.registerQueue({ name: EMBED_QUEUE })` + `exports: [BullModule]`. Imported once in `AppModule` (step 37). Do NOT call `forRoot*` again.
- ✅ `apps/backend/src/embed/embed.service.ts` — `EmbedService.batchEmbedRace(raceId: string): Promise<void>`. Returns early if no results. Exported from `EmbedModule`.
- ✅ `apps/backend/src/embed/embed.module.ts` — CURRENT `imports: [TypeOrmModule.forFeature([RaceResult]), VectorStoreModule, OpenAiModule]`, `providers: [RaceResultSerializerService, EmbedService]`, `exports: [EmbedService]`. Does NOT yet import `QueueModule`.
- ✅ `IngestionService` calls `await this.embedService.batchEmbedRace(raceId)` synchronously after the DB transaction (step 31) — leave untouched in this step.
- Packages: `@nestjs/bullmq@^11.0.4`, `bullmq@^5.78.1`. Verified exports: `Processor` (decorator), `WorkerHost` (abstract, `abstract process(job: Job, token?: string): Promise<any>`), `OnWorkerEvent`, `InjectQueue`. `Job` type is imported from `bullmq`.
- Infra is healthy: Postgres (5433), Qdrant (6333), Redis up.
- Test baseline: 145 tests passing → expect +2 after this step.
- Existing spec harness convention: standalone-const (plain `new Service(...)`, mocked deps via `jest.fn()` captured in consts) — see `apps/backend/src/embed/embed.service.spec.ts`. NOT `@nestjs/testing`.

## Deliverables (definition of done)
1. **New `EmbedJobData` interface** at `apps/backend/src/queue/embed-job.types.ts` — named export `export interface EmbedJobData { raceId: string; }`. Located in the queue area so both the worker (step 38) and the future producer (step 39) import the exact same type.
2. **New `apps/backend/src/embed/embed.processor.ts`** — named export `EmbedProcessor`:
   - Decorated `@Processor(EMBED_QUEUE)` (from `@nestjs/bullmq`; `EMBED_QUEUE` from `../queue/queue.constants.js`).
   - `extends WorkerHost`.
   - Constructor injects `private readonly embedService: EmbedService` and calls `super()`.
   - Private `Logger` instance: `private readonly logger = new Logger(EmbedProcessor.name);`.
   - `async process(job: Job<EmbedJobData>): Promise<void>` — destructures `const { raceId } = job.data;`, logs start (include `job.id` and `raceId`), `await this.embedService.batchEmbedRace(raceId)`, logs finish. Errors are NOT caught — they propagate.
   - `import type { Job } from 'bullmq';`, `import type { EmbedJobData } from '../queue/embed-job.types.js';`.
   - (Optional, recommended) `@OnWorkerEvent('failed')` handler logging failed `job.id` + error via `this.logger.error(...)`. If added, it must be covered by a test or be trivially side-effect-free.
3. **`EmbedModule` updated** (`apps/backend/src/embed/embed.module.ts`):
   - Add `QueueModule` (from `../queue/queue.module.js`) to `imports`.
   - Add `EmbedProcessor` to `providers`.
   - `EmbedService` remains in `exports`. No other changes.
4. **New `apps/backend/src/embed/embed.processor.spec.ts`** (standalone-const harness, NOT `@nestjs/testing`):
   - Capture `const batchEmbedRace = jest.fn();` and build `const embedService = { batchEmbedRace } as unknown as EmbedService;`.
   - Construct directly: `const processor = new EmbedProcessor(embedService);` (calling `super()` is fine — do NOT access the `worker` getter).
   - Fake job: `const job = { id: '1', data: { raceId: 'race-1' } } as unknown as Job<EmbedJobData>;`.
   - Case (a): `process` calls `batchEmbedRace` exactly once with `'race-1'` (`expect(batchEmbedRace).toHaveBeenCalledTimes(1)` + `toHaveBeenCalledWith('race-1')`).
   - Case (b): when `batchEmbedRace` rejects with a captured `error`, `await expect(processor.process(job)).rejects.toBe(error)` (error propagates, not swallowed).
   - Satisfy lint: capture all `jest.fn()`s in consts (`unbound-method`); any async helper contains an `await` (`require-await`).
5. **Verification** — all pass:
   - `pnpm --filter backend lint`
   - `pnpm --filter backend test` (expect 147 = 145 + 2)
   - `pnpm --filter backend build`
   - App boots and a `race-embed` worker registers at startup without error.
   - Note: true end-to-end (enqueue → process) is NOT verifiable here — there is no producer until step 39. State this explicitly.
6. **Scope statement honored**: NO `IngestionService` enqueue wiring; NO removal of the synchronous `batchEmbedRace` call. Both are step 39.

## Rules that must hold
- No `any`. `process` is typed `(job: Job<EmbedJobData>): Promise<void>` (narrowing the base `Promise<any>` is allowed and keeps our code `any`-free).
- Named exports only. ESM `.js` relative imports.
- NestJS module/provider structure: the worker is a provider in `EmbedModule`; discovery is via `@Processor` metadata.
- `EmbedModule` must `import QueueModule` so the worker binds to `EMBED_QUEUE`. Do NOT call `BullModule.forRoot*` again (already global via `QueueModule`/`AppModule`).
- Errors propagate out of `process` — BullMQ owns retry/failure. Do NOT swallow.
- Tests use the standalone-const harness; `jest.fn()`s captured in consts; async helpers contain `await`.
- Do NOT change `IngestionService` or `EmbedService` logic.

## Build steps
1. Create `apps/backend/src/queue/embed-job.types.ts` with the `EmbedJobData` interface.
2. Create `apps/backend/src/embed/embed.processor.ts` with `EmbedProcessor` per Deliverable 2.
3. Update `apps/backend/src/embed/embed.module.ts`: add `QueueModule` to `imports`, `EmbedProcessor` to `providers`.
4. Create `apps/backend/src/embed/embed.processor.spec.ts` with the two cases.
5. Run `pnpm --filter backend lint`, then `pnpm --filter backend test`, then `pnpm --filter backend build`.
6. Start the backend (`pnpm --filter backend start:dev`) and confirm the `race-embed` worker registers with no errors at boot.

## Notes for the implementer
- **WorkerHost in tests:** `WorkerHost` is an abstract class; `super()` in the constructor is safe to call. Do NOT read the `worker` getter — it would attempt to build a real BullMQ `Worker` (and need Redis). Constructing `new EmbedProcessor(mock)` and calling `process(job)` directly is sufficient and Redis-free.
- **Typing the fake job:** `Job<EmbedJobData>` has many fields; cast a minimal object `as unknown as Job<EmbedJobData>` (only `id` and `data` are read by the code).
- **Logging:** use Nest `Logger`. For the optional `failed` handler follow the project convention: `this.logger.error(msg, error instanceof Error ? error.stack : String(error))`.
- **What step 39 will add (do NOT do now):** wire `IngestionService` to enqueue an `EmbedJobData` job onto `EMBED_QUEUE` (via `@InjectQueue(EMBED_QUEUE)`), then remove the synchronous `batchEmbedRace` call. That step also enables real end-to-end verification.
- **Future config (out of scope, defaults for now):** concurrency, retry/backoff policy, rate limiting, dead-letter handling, Bull Board UI, graceful shutdown — all use BullMQ defaults this step; note as future work.
- **Out of scope:** any change to `EmbedService.batchEmbedRace` internals.
- **Open questions:** none blocking. Confirm preference on the optional `@OnWorkerEvent('failed')` handler — recommended for observability; include it only if you add a test or keep it side-effect-only.