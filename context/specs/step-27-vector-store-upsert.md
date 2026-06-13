# Implementation Task: VectorStoreService.upsert — write vectors + metadata to Qdrant

## What to build
Implement the existing `upsert(points: QdrantPoint[]): Promise<void>` stub in
`apps/backend/src/vector-store/vector-store.service.ts` so it writes a batch of
points (id + embedding vector + payload metadata) to the `race_results` Qdrant
collection, confirming the write before returning. Scope is the upsert path only —
querying (step 28), text serialization (step 29), and embedding (steps 30–31) are
out of scope.

## Current state
- `apps/backend/src/vector-store/vector-store.service.ts` — `upsert` is a stub that
  rejects with `new Error('not implemented — see step 27')`. `onModuleInit` (collection
  creation) and `query` stub already exist. `QdrantPoint` / `QdrantResult` interfaces
  defined here.
- `apps/backend/src/vector-store/vector-store.constants.ts` — exports
  `QDRANT_CLIENT`, `RACE_RESULTS_COLLECTION = 'race_results'`,
  `EMBEDDING_DIMENSION = 1536`, `VECTOR_DISTANCE = 'Cosine'`.
- `apps/backend/src/vector-store/vector-store.module.ts` — provides `QDRANT_CLIENT`
  via `useFactory(ConfigService)`; exports both the token and `VectorStoreService`.
- `@qdrant/js-client-rest` v1.18 — `upsert(collection_name, { wait?, ...PointsList })`.
- No `vector-store.service.spec.ts` exists yet — must be created.
- Test convention reference: `apps/backend/src/athletes/athletes.service.spec.ts`
  (manual mock object cast `as unknown as <Type>`, `jest.fn()` per method,
  `new Service(mock)` in `beforeEach`, `jest.clearAllMocks()`).

## Deliverables (definition of done)
1. `upsert` is `async` and calls `this.client.upsert(RACE_RESULTS_COLLECTION, { wait: true, points: [...] })`.
2. Each input `QdrantPoint` is mapped to `{ id, vector, payload }` (PointStruct shape);
   no field renaming, no payload mutation.
3. `RACE_RESULTS_COLLECTION` constant is used — no hardcoded `'race_results'` string.
4. `wait: true` is passed (synchronous confirmation). The boolean is referenced via a
   named constant `WAIT_FOR_UPSERT = true` — no bare magic literal in the call.
5. Method returns `Promise<void>` — the client's `UpdateResult` is not leaked to callers.
6. Empty-input guard: when `points.length === 0`, the method returns without calling
   `this.client.upsert` (verified by test).
7. A debug log line records the number of points upserted (use existing `this.logger`).
8. New file `apps/backend/src/vector-store/vector-store.service.spec.ts` exists with the
   test cases listed under "Build steps" — all green via `pnpm --filter backend test`.
9. `pnpm --filter backend lint` and `pnpm --filter backend build` pass with no `any`.

## Rules that must hold
- No `any` — use `QdrantPoint[]` for input; `import type` for type-only Qdrant imports.
- No magic strings/numbers — collection name and `wait` flag via named constants.
- Named exports only; keep `@Injectable()` and constructor injection unchanged.
- Do not alter `onModuleInit`, `query`, the constants file, or the module wiring.
- Do not change the public signature `upsert(points: QdrantPoint[]): Promise<void>`.
- Errors from the client must propagate (no swallow); reject as-is.
- The caller-facing contract returns `void`; do not return the Qdrant response.

## Build steps
1. Add `WAIT_FOR_UPSERT = true` constant to the service file (above the class).
2. Replace the `upsert` stub body: add the empty-array early return, map `points` to
   PointStruct objects, await `this.client.upsert(...)` with `WAIT_FOR_UPSERT`, log
   the count.
3. Create `vector-store.service.spec.ts`:
   - Mock `QdrantClient` as `{ upsert: jest.fn() } as unknown as QdrantClient`
     (only the methods used by `upsert` need mocking; `onModuleInit` is not exercised here).
   - `beforeEach`: `jest.clearAllMocks()`, instantiate `new VectorStoreService(mockClient)`.
   - Test (happy path): given 2 valid points, `client.upsert` is called once with
     `RACE_RESULTS_COLLECTION` and `{ wait: true, points: [...] }`; assert the mapped
     points preserve id/vector/payload.
   - Test (empty input): given `[]`, `client.upsert` is NOT called and the promise resolves.
   - Test (error case): when `client.upsert` rejects, `upsert` rejects with the same error.
4. Run `pnpm --filter backend build`, `lint`, and `test`.

## Notes for the implementer
**Out of scope:** `query` (step 28), serializer (29), `EmbedService` (30–31), collection
creation logic, retry/backoff, batching/chunking large arrays into sub-requests.

**Files to change:**
- `apps/backend/src/vector-store/vector-store.service.ts` (edit stub)
- `apps/backend/src/vector-store/vector-store.service.spec.ts` (new)

**`wait: true`** is intentional — synchronous writes keep step 31 (batch embed after
ingestion) deterministic. Payload typing stays `Record<string, unknown>` — the schema
is defined later by the serializer in step 29.

**Open questions (deferred):**
1. Chunking large `points` arrays into sub-requests — not needed yet; revisit at step 31.
2. Client-side dimension validation (`vector.length === EMBEDDING_DIMENSION`) — Qdrant
   rejects mismatches server-side; add as hardening if needed later.