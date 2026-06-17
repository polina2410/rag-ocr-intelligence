# Implementation Task: EmbeddingStatus Indicator on Race Dashboard (Step 80)

## What to build
Track each race's background-embedding state (`pending` / `complete` / `failed`) as a column on the `Race` entity, expose it in `RaceDto` from `GET /races`, and surface a small status indicator on `RaceCard` that only appears while a race is not yet `complete`. The races list polls every 3 s while any race is still `pending`.

## Current state
- `apps/backend/src/entities/race.entity.ts` — `Race` entity, 7 columns, NO `embedding_status` column
- `packages/types/src/race.dto.ts` — `RaceDto` interface, 7 fields, NO `embeddingStatus`; consumed by both apps via `@ocr/types`
- `apps/backend/src/embed/embed.processor.ts` — `EmbedProcessor.process()` calls `embedService.batchEmbedRace(raceId)` then logs; `onFailed()` only logs. Constructor injects ONLY `EmbedService` — has NO `RaceRepository`
- `apps/backend/src/embed/embed.module.ts` — imports `TypeOrmModule.forFeature([RaceResult])` (NOT `Race`), `VectorStoreModule`, `OpenAiModule`, `QueueModule`
- `apps/backend/src/races/races.service.ts` — `findAll()` maps rows to `RaceDto` (7 fields only)
- `apps/backend/src/ingestion/ingestion.service.ts` — creates `Race` inside transaction (no status field), then calls `embedQueue.add(EMBED_JOB, { raceId })` after the transaction
- TypeORM config: `synchronize: false`, no `migrations` / `migrationsRun` config, no migrations directory
- `apps/frontend/src/pages/RacesPage.tsx` — `useQuery({ queryKey: ['races'], queryFn: () => getRaces() })`, NO `refetchInterval`
- `apps/frontend/src/components/RaceCard.tsx` — renders name, Badge, date, location, distance, obstacles; NO embedding indicator

## Deliverables (definition of done)
1. `RaceDto` (`packages/types/src/race.dto.ts`) gains `embeddingStatus: 'pending' | 'complete' | 'failed'`; type rebuilt so both apps see the new field.
2. `Race` entity has an `embeddingStatus` property mapped to a `varchar(20)` column named `embedding_status` with DB-level default `'pending'`.
3. Schema applied to the running DB: a one-off `ALTER TABLE races ADD COLUMN embedding_status varchar(20) NOT NULL DEFAULT 'pending'` + `UPDATE races SET embedding_status = 'complete'` to backfill existing rows (assumes existing races are already embedded).
4. `EmbedModule` adds `Race` to `TypeOrmModule.forFeature([RaceResult, Race])`.
5. `EmbedProcessor` injects `@InjectRepository(Race)` and after `batchEmbedRace` resolves in `process()`, updates that race's `embeddingStatus` to `'complete'`.
6. `EmbedProcessor.onFailed()` updates the race's `embeddingStatus` to `'failed'` — guarded so a missing-race or repo error cannot throw out of the event handler.
7. `RacesService.findAll()` includes `embeddingStatus` in each mapped `RaceDto`.
8. `RaceCard` renders a status indicator ONLY when `race.embeddingStatus !== 'complete'`: distinct copy for `'pending'` vs `'failed'`, using design tokens, with accessible text label (not color-only).
9. `RacesPage` adds `refetchInterval: (query) => query.state.data?.data.some(r => r.embeddingStatus === 'pending') ? POLL_INTERVAL_MS : false` to the `useQuery` options. `POLL_INTERVAL_MS = 3000` as a named constant.
10. New tests in `embed.processor.spec.ts` covering: (a) `process()` sets status `'complete'` on success; (b) `onFailed()` sets status `'failed'`.
11. `pnpm --filter backend lint`, `pnpm --filter backend test`, `pnpm --filter frontend lint`, `pnpm --filter frontend build` all pass.

## Rules that must hold
- Status union `'pending' | 'complete' | 'failed'` extracted as named constants — no magic strings across files
- `POLL_INTERVAL_MS = 3000` as a named constant in `RacesPage.tsx`
- DB column name `embedding_status` (snake_case), length 20, matching existing convention (`distance_km`, `total_obstacles`, `race_type`)
- Default `'pending'` set by COLUMN DEFAULT — do NOT pass `embeddingStatus` in `IngestionService`'s `manager.create(Race, …)` call
- Status writes in the processor must not crash the worker or re-trigger retries — guard the repo call in `onFailed`
- Frontend: CSS Modules only, no inline styles, design tokens only for colors/font-sizes
- `'complete'` races show NO new UI element — happy path stays uncluttered
- No `any` types anywhere

## Build steps
1. Add `embeddingStatus: 'pending' | 'complete' | 'failed'` to `RaceDto` in `packages/types/src/race.dto.ts`; rebuild types (`pnpm --filter @ocr/types build` or equivalent).
2. Add `embedding_status` column to `Race` entity (varchar, length 20, default `'pending'`, name `'embedding_status'`). Apply the ALTER TABLE + UPDATE manually to the running Postgres DB (port 5433).
3. Add `Race` to `TypeOrmModule.forFeature([RaceResult, Race])` in `embed.module.ts`.
4. Inject `@InjectRepository(Race)` into `EmbedProcessor`; in `process()`, after the `batchEmbedRace` await, call `raceRepo.update(raceId, { embeddingStatus: EMBED_STATUS.COMPLETE })`. In `onFailed()`, read `raceId` defensively from `job?.data.raceId` and guard the update so it cannot throw.
5. Add `embeddingStatus: row.embeddingStatus` to the `RaceDto` mapping in `RacesService.findAll()`.
6. Add the status indicator to `RaceCard`: import status constants, conditionally render a `<span>` with accessible text and CSS Module class when `race.embeddingStatus !== 'complete'`; add `.statusPending` and `.statusFailed` rules to `RaceCard.module.css` using `var(--color-text-muted)` / `var(--color-accent)` / `var(--font-size-xs)`.
7. Add `refetchInterval` to the `useQuery` in `RacesPage.tsx` with the `POLL_INTERVAL_MS` constant.
8. Write two new `EmbedProcessor` tests (deliverable 10); run `pnpm --filter backend test`.
9. Run all four quality-gate commands from deliverable 11.

## Notes for the implementer
- **`batchEmbedRace` returns early (no throw) when a race has zero results** — `process()` still resolves, so such a race correctly becomes `'complete'`. That is the intended behavior.
- **Race deleted before job runs** — `raceRepo.update` on a missing ID is a no-op in TypeORM (returns `{ affected: 0 }`); no extra guard needed in `process()`. In `onFailed()` the same applies, but still wrap in try/catch to be safe.
- **`onFailed` job arg is `undefined`-able** — read `job?.data.raceId` before attempting the status write; if undefined, skip.
- **Polling stop condition** — `'failed'` races must NOT keep polling alive; only `'pending'` triggers polling. Once all races are `'complete'` or `'failed'`, `refetchInterval` returns `false`.
- **`EmbedProcessor` test harness** — existing spec constructs the processor directly without a NestJS testing module. Extend the same harness; mock `raceRepo` as `{ update: jest.fn() }`.
- **Out of scope:** status on `RaceDetailDto`/detail page, retry action for failed races, WebSocket/SSE push, per-result progress, BullMQ queue-state queries.
- **Status constants suggestion:** define `export const EMBED_STATUS = { PENDING: 'pending', COMPLETE: 'complete', FAILED: 'failed' } as const` in a shared constants file (e.g. `embed/embed.constants.ts`) and reuse on both backend (processor, entity) and share via `@ocr/types` if desired — or keep them separate. Do not duplicate string literals.
