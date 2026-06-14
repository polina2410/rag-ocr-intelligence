# Implementation Task: EmbedService — Batch Embed a Race and Upsert Vectors to Qdrant

## What to build
Add `batchEmbedRace(raceId: string): Promise<void>` to `EmbedService`. It loads every
`RaceResult` for a race (with `race`, `athlete`, `splits` relations), serializes each to a
text chunk, embeds it, and upserts the vectors plus attribution payload into Qdrant. Then
wire `IngestionService.ingestCsv` to call it synchronously after the DB transaction commits.

## Current state
- ✅ `apps/backend/src/embed/embed.service.ts` — `EmbedService` exists with `embed(text): Promise<number[]>` only; constructor takes a single positional arg `@Inject(OPENAI_CLIENT) client: OpenAI`.
- ✅ `apps/backend/src/embed/embed.module.ts` — provides `OPENAI_CLIENT` factory + `EmbedService`; exports `EmbedService`. No TypeORM, no VectorStore, no serializer imports yet.
- ✅ `apps/backend/src/embed/embed.service.spec.ts` — 3 existing `embed` tests; constructs `new EmbedService(client)` with ONE positional arg. Adding constructor deps WILL break these call sites — they must be updated.
- ✅ `apps/backend/src/embed/embed.constants.ts` — `OPENAI_CLIENT`, `EMBEDDING_MODEL`.
- ✅ `apps/backend/src/serializer/race-result-serializer.service.ts` — `RaceResultSerializerService.serialize(result: RaceResult): string`. Reads `result.athlete`, `result.race`, and `result.splits` — ALL three relations must be populated. **No `SerializerModule` exists** — only the service + spec live in `serializer/`.
- ✅ `apps/backend/src/vector-store/vector-store.service.ts` — `upsert(points: QdrantPoint[]): Promise<void>`; already early-returns on empty array. `QdrantPoint = { id: string; vector: number[]; payload: Record<string, unknown> }`.
- ✅ `apps/backend/src/vector-store/vector-store.module.ts` — exports `VectorStoreService`.
- ✅ `apps/backend/src/ingestion/ingestion.service.ts` — `ingestCsv(fileBuffer): Promise<{ raceId; rowsIngested }>`; raceId returned after the transaction. No embedding step yet.
- ✅ `apps/backend/src/ingestion/ingestion.module.ts` — imports `TypeOrmModule.forFeature([Race, Athlete, RaceResult, ObstacleSplit])`; providers include `IngestionService`. Does NOT import `EmbedModule`.
- `Race.date` is a TypeORM `date` column typed as `string` — `payload.raceDate` will be a string, not a `Date`.

## Deliverables (definition of done)
1. `EmbedService.batchEmbedRace(raceId: string): Promise<void>` exists and is public.
2. `EmbedService` constructor gains three additional injected deps alongside `OPENAI_CLIENT`: `@InjectRepository(RaceResult) raceResultRepo: Repository<RaceResult>`, `RaceResultSerializerService`, `VectorStoreService`. Existing `embed()` behaviour is unchanged.
3. `batchEmbedRace` loads results via the repo filtered by `raceId` with relations `race`, `athlete`, `splits` populated (e.g. `find({ where: { raceId }, relations: { race: true, athlete: true, splits: true } })`).
4. If zero rows are returned, the method returns early WITHOUT calling `serialize`, `embed`, or `upsert` (clean no-op).
5. For each result: `chunk = serializer.serialize(result)`, `vector = await this.embed(chunk)`. Processed sequentially.
6. `QdrantPoint[]` built where each point is `{ id: result.id, vector, payload }` and payload is exactly: `{ raceResultId: result.id, raceId: result.raceId, athleteId: result.athleteId, athleteName: \`${result.athlete.firstName} ${result.athlete.lastName}\`, raceName: result.race.name, raceDate: result.race.date }`.
7. `await this.vectorStore.upsert(points)` called once with the full array.
8. Errors from `serialize`, `embed`, or `upsert` propagate unchanged — no try/catch.
9. `EmbedModule` updated: `imports: [TypeOrmModule.forFeature([RaceResult]), VectorStoreModule]`; `RaceResultSerializerService` added to `providers` (no `SerializerModule` — register directly). `EmbedService` still the only export.
10. `IngestionModule` updated: imports `EmbedModule`.
11. `IngestionService` injects `EmbedService`; after `dataSource.transaction(...)` resolves, calls `await this.embedService.batchEmbedRace(raceId)` before returning `{ raceId, rowsIngested }`.
12. Existing `embed.service.spec.ts` construction sites updated to pass mocks for all four constructor args; the 3 original `embed` tests still pass.
13. New unit tests for `batchEmbedRace` cover: (a) happy path — N rows produce N points with correct ids/payload, single `upsert` call; (b) empty result set — `upsert` NOT called; (c) error propagation — rejection from `embed` bubbles out of `batchEmbedRace`.
14. `pnpm --filter backend test` and `pnpm --filter backend build` pass.

## Rules that must hold
- No `any` — use `Repository<RaceResult>` and proper types; `payload` typed as `Record<string, unknown>` is fine.
- OpenAI calls stay inside `EmbedService` — do not inline OpenAI in `IngestionService`.
- Embedding triggered synchronously (`await`) for now; steps 38–39 will replace this one-line call with a Bull job dispatch — keep it a trivially replaceable one-liner.
- Errors from `embed()` / `upsert()` must NOT be swallowed.
- Tests must mock repo, serializer, `embed`, and `VectorStoreService` — do NOT hit Postgres, Qdrant, or OpenAI.
- `RaceResult` feature registered in both `IngestionModule` and `EmbedModule` is allowed in TypeORM — do not remove it from `IngestionModule`.
- Match the per-directory `.js` import-suffix convention already in each file.

## Build steps
1. In `embed.service.ts`, add constructor params: keep `@Inject(OPENAI_CLIENT) client: OpenAI`; add `@InjectRepository(RaceResult) raceResultRepo`, `serializer: RaceResultSerializerService`, `vectorStore: VectorStoreService`.
2. Implement `batchEmbedRace`: load rows → if empty, `return` → for each: serialize + embed → build points → `await vectorStore.upsert(points)`.
3. Update `embed.module.ts` imports and providers (deliverable 9).
4. Update `ingestion.module.ts` to import `EmbedModule`.
5. Inject `EmbedService` into `IngestionService`; add `await this.embedService.batchEmbedRace(raceId)` after the transaction.
6. Update `embed.service.spec.ts` construction sites; add `batchEmbedRace` tests (deliverable 13).
7. Run `pnpm --filter backend test` then `pnpm --filter backend build`; fix until green.

## Notes for the implementer
- **Out of scope:** Bull/Redis queue (steps 37–39), `RetrieveService` (step 32), retry/backoff, idempotency/dedup, batching N chunks into one OpenAI request (N rows = N API calls; acceptable for this step).
- **Files likely affected:** `embed.service.ts`, `embed.module.ts`, `embed.service.spec.ts`, `ingestion.service.ts`, `ingestion.module.ts`.
- **Critical gotcha — constructor breaking change:** `embed.service.spec.ts` currently constructs `new EmbedService(client)` with one positional arg. After adding three more deps, every construction site must pass all four mocks or tests won't compile.
- **Relations must be loaded:** `serialize()` reads `result.athlete.firstName`, `result.race.name`, `result.splits` — if relations aren't in the `find()` call, these will be `undefined` and serialize will produce wrong output or throw.
- **`Race.date` is a string**, not a `Date` object — assert `raceDate` as a string in tests.
- **Open question (non-blocking):** after the DB transaction commits, a failed OpenAI call leaves committed rows with no vectors and surfaces an error to the HTTP caller. This is acceptable for step 31 — steps 38–39 move embedding to a background job which resolves this.