# Implementation Task: Wire CSV Ingestion Endpoint to Enqueue BullMQ Embed Job (Step 39 — final step of Phase 3)

## What to build
Replace the synchronous `embedService.batchEmbedRace(raceId)` call in `IngestionService` with enqueuing a BullMQ job on the `race-embed` queue, so embedding runs in the background via the step-38 `EmbedProcessor` instead of blocking the `POST /ingest/csv` HTTP response. This is the producer half that makes the queue do work. (Library: **BullMQ via `@nestjs/bullmq`**.)

## Current state
- `apps/backend/src/ingestion/ingestion.service.ts` — `IngestionService.ingestCsv(fileBuffer)`. Constructor injects, in order: `CsvMetadataParserService`, `CsvRowsParserService`, `@InjectRepository(Race) raceRepo`, `@InjectRepository(Athlete) athleteRepo`, `DataSource dataSource`, `EmbedService embedService`. Flow: parse (throws `UnprocessableEntityException` on parse error) → save inside `dataSource.transaction` wrapped in try/catch (throws `InternalServerErrorException`, logging full error stack) → **line 116, AFTER the transaction and OUTSIDE the try/catch:** `await this.embedService.batchEmbedRace(raceId);` → `return { raceId, rowsIngested: rows.length };`. Imports are **extensionless relative** (e.g. `'../embed/embed.service'`, `'./csv-metadata-parser.service'`).
- `apps/backend/src/ingestion/ingestion.module.ts` — `imports: [TypeOrmModule.forFeature([Race, Athlete, RaceResult, ObstacleSplit]), EmbedModule]`; `controllers: [IngestionController]`; `providers: [CsvMetadataParserService, CsvRowsParserService, IngestionService]`; `exports: [CsvMetadataParserService, CsvRowsParserService]`. Extensionless relative imports.
- `apps/backend/src/ingestion/ingestion.service.spec.ts` — standalone-const harness (mocks declared as module-level consts, no NestJS `Test` module). Has `mockEmbedService = { batchEmbedRace: jest.fn().mockResolvedValue(undefined) }` and constructs `new IngestionService(mockMetadataParser, mockRowsParser, mockRaceRepo, mockAthleteRepo, mockDataSource, mockEmbedService)`. Existing tests: metadata-parse-error→422, parser-message-surfaced→422, rows-parse-error→422, transaction-reject→500, no-leak-of-DB-error→500, success→returns `{ raceId, rowsIngested }`. The success test mocks `dataSource.transaction` → resolves `'race-uuid-123'`. **No current assertion on the embed/enqueue call.**
- ✅ Step 37 — `apps/backend/src/queue/queue.constants.ts`: `export const EMBED_QUEUE = 'race-embed';`.
- ✅ Step 37 — `apps/backend/src/queue/queue.module.ts`: `QueueModule` runs `BullModule.forRootAsync` (Redis connection from `REDIS_HOST`/`REDIS_PORT`), registers `BullModule.registerQueue({ name: EMBED_QUEUE })`, and `exports: [BullModule]`. Uses `.js`-extension imports internally.
- ✅ Step 38 — `apps/backend/src/queue/embed-job.types.ts`: `export interface EmbedJobData { raceId: string }`.
- ✅ Step 38 — `EmbedProcessor` (`@Processor(EMBED_QUEUE)`, extends `WorkerHost`) consumes the queue and calls `EmbedService.batchEmbedRace(raceId)`. Its `process` handles ALL job names (no name filtering), so any job name works.
- Packages: `@nestjs/bullmq` (exports `InjectQueue`, `BullModule`); `bullmq` (provides the `Queue` type; `Queue.add(name: string, data, opts?): Promise<Job>`).

## Deliverables (definition of done)
1. **`EMBED_JOB` constant** — `apps/backend/src/queue/queue.constants.ts` gains a named export `export const EMBED_JOB = 'embed-race';` (existing `EMBED_QUEUE` unchanged). Verify: grep shows both exports.
2. **`IngestionService` updated** — `EmbedService` constructor param and its import removed; new constructor param `@InjectQueue(EMBED_QUEUE) private readonly embedQueue: Queue<EmbedJobData>` added (replacing the `embedService` slot — it is the last constructor arg); line-116 call replaced with `await this.embedQueue.add(EMBED_JOB, { raceId });`; enqueue remains AFTER the transaction and OUTSIDE the try/catch; the `return { raceId, rowsIngested: rows.length };` line is unchanged. Imports updated: remove `EmbedService`; add `InjectQueue` from `@nestjs/bullmq`, `Queue` (type) from `bullmq`, and `EmbedJobData` / `EMBED_QUEUE` / `EMBED_JOB` from the queue files — all using this file's **extensionless** relative-import style (`'../queue/queue.constants'`, `'../queue/embed-job.types'`). Verify: no remaining reference to `embedService`/`batchEmbedRace` in the file.
3. **`IngestionModule` updated** — `EmbedModule` import replaced with `QueueModule` (in both the `import` statement and the `imports: [...]` array); extensionless relative-import style for the new `QueueModule` import. `TypeOrmModule.forFeature(...)`, `controllers`, `providers`, `exports` unchanged. Verify: no `EmbedModule` reference remains in this file.
4. **`ingestion.service.spec.ts` updated** —
   - `mockEmbedService` replaced with `const mockEmbedQueue = { add: jest.fn().mockResolvedValue(undefined) } as unknown as Queue<EmbedJobData>;` (import `Queue` as a type from `bullmq`, `EmbedJobData` from `'../queue/embed-job.types'`, `EMBED_JOB` from `'../queue/queue.constants'`; remove the `EmbedService` type import).
   - Constructor call's last arg changed from `mockEmbedService` to `mockEmbedQueue`.
   - Success test asserts `expect(mockEmbedQueue.add).toHaveBeenCalledWith(EMBED_JOB, { raceId: 'race-uuid-123' })` (in addition to the existing return-value assertion).
   - **New test:** when `dataSource.transaction` rejects, the service throws `InternalServerErrorException` AND `expect(mockEmbedQueue.add).not.toHaveBeenCalled()` (enqueue happens only after a successful save).
   - All existing parse/DB error tests still pass unchanged (they throw before the enqueue point).
5. **Verification commands all pass** — `pnpm --filter backend lint`; `pnpm --filter backend test` (currently 148 tests; expect ≈149 after adding the no-enqueue-on-failure test, net +1/-0); `pnpm --filter backend build`.
6. **End-to-end note recorded** (no code) — with `docker compose up -d` (Postgres/Qdrant/Redis) and the app running, `POST /ingest/csv` saves the race, returns immediately, and `EmbedProcessor` picks up the job (worker logs "Embedding race ..."). Full embedding into Qdrant additionally needs a real `OPENAI_API_KEY`; the local `.env` has a placeholder, so the embed step will fail at the OpenAI call — this is expected and NOT a defect of this step.

## Rules that must hold
- No `any`. The queue must be typed `Queue<EmbedJobData>` everywhere (service + spec mock cast).
- Named exports only (`EMBED_JOB`).
- **No magic strings:** queue name uses `EMBED_QUEUE`, job name uses `EMBED_JOB` — `embedQueue.add` must not contain a literal string.
- Match each file's **existing internal import style**: the `ingestion.*` files use extensionless relative imports — keep them extensionless (do NOT introduce `.js`). (`queue.module.ts` uses `.js` internally; leave it as-is — do not touch it.)
- Enqueue stays after the transaction and is NOT swallowed into the DB try/catch.
- Tests use the standalone-const harness; capture every `jest.fn()` in a const (avoids `unbound-method`); any added async test helper must contain an `await` (avoids `require-await`).
- Do NOT change `EmbedProcessor`, `EmbedService`, `QueueModule`, the controller, or the DTO.

## Build steps
1. In `apps/backend/src/queue/queue.constants.ts`, add `export const EMBED_JOB = 'embed-race';` below the existing `EMBED_QUEUE`.
2. In `apps/backend/src/ingestion/ingestion.service.ts`:
   a. Remove `import { EmbedService } from '../embed/embed.service';`.
   b. Add `import { InjectQueue } from '@nestjs/bullmq';`, `import type { Queue } from 'bullmq';`, `import type { EmbedJobData } from '../queue/embed-job.types';`, `import { EMBED_QUEUE, EMBED_JOB } from '../queue/queue.constants';` (extensionless).
   c. Replace the `private readonly embedService: EmbedService,` constructor param with `@InjectQueue(EMBED_QUEUE) private readonly embedQueue: Queue<EmbedJobData>,`.
   d. Replace line 116 (`await this.embedService.batchEmbedRace(raceId);`) with `await this.embedQueue.add(EMBED_JOB, { raceId });`. Leave it after the transaction / outside the try/catch; leave the `return` unchanged.
3. In `apps/backend/src/ingestion/ingestion.module.ts`, replace the `EmbedModule` import line with a `QueueModule` import (extensionless: `import { QueueModule } from '../queue/queue.module';`) and replace `EmbedModule` with `QueueModule` in the `imports` array.
4. In `apps/backend/src/ingestion/ingestion.service.spec.ts`:
   a. Replace the `EmbedService` type import with `import type { Queue } from 'bullmq';`, `import type { EmbedJobData } from '../queue/embed-job.types';`, and `import { EMBED_JOB } from '../queue/queue.constants';`.
   b. Replace `mockEmbedService` const with `mockEmbedQueue` (`{ add: jest.fn().mockResolvedValue(undefined) } as unknown as Queue<EmbedJobData>`).
   c. Update the `new IngestionService(...)` last arg to `mockEmbedQueue`.
   d. Add the `add` assertion to the success test.
   e. Add the new "does not enqueue when the transaction fails" test.
5. Run `pnpm --filter backend lint`, then `pnpm --filter backend test`, then `pnpm --filter backend build`; fix any failures.

## Notes for the implementer
- **Import-style gotcha:** `queue.module.ts` imports with `.js` (`'./queue.constants.js'`) while `ingestion.*` files are extensionless. Keep each file internally consistent — write extensionless imports in the `ingestion.*` files. The build tolerates both; do not "normalize" one to match the other.
- **Enqueue-failure semantics (FINAL decision):** the enqueue stays outside the DB try/catch, preserving the pre-existing "error-after-successful-save propagates to the caller" behavior — exactly as the old `await batchEmbedRace` did. Do NOT wrap it in the DB try/catch (that would mis-map an enqueue error to a DB 500 and is semantically wrong). An enqueue failure (e.g. Redis down) is far rarer than the old synchronous-embed failure.
- **Why drop `EmbedModule` from `IngestionModule`:** `IngestionService` no longer references `EmbedService`; it needs the injectable queue, which `QueueModule` provides (it registers `EMBED_QUEUE` and exports `BullModule`). `EmbedModule` stays in the DI graph via `AppModule` and is where `EmbedProcessor`/`EmbedService` live, so removing it here is safe.
- **e2e / OPENAI caveat:** see Deliverable 6 — the embed step failing at OpenAI with a placeholder key is expected, not a defect of this step. Success of this step = race saved, response returned immediately, job enqueued, processor logs that it picked up the job.
- **Out of scope (do NOT implement):** job retry/backoff/concurrency options on `.add` or the worker (BullMQ defaults — future); returning a job id to the client or a job-status endpoint; best-effort enqueue (log-and-succeed) — noted as a future option only; any change to `EmbedProcessor`/`EmbedService`/controller/DTO; idempotency/dedup of re-uploaded races.
- **Future options (note only):** best-effort enqueue with log-and-succeed; configurable retry/backoff; job-status endpoint returning the BullMQ job id.
- **Open questions:** none — all decisions are FINAL (BullMQ; enqueue after save; failures propagate).