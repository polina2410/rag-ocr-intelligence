# Implementation Task: VectorStoreService — Query Qdrant for Top-K Similar Vectors

## What to build
Implement the `query(vector, topK)` method on `VectorStoreService` so it calls the
Qdrant client's `search` against the `race_results` collection and returns the
top-k most similar points mapped to the existing `QdrantResult` interface. This is
the read side that step 32 (`RetrieveService`) will consume.

## Current state
- ✅ `apps/backend/src/vector-store/vector-store.service.ts` — service exists; `onModuleInit` (step 26) and `upsert` (step 27) implemented; `query` is a stub that rejects with `not implemented — see step 28`.
- ✅ `QdrantResult` interface already defined: `{ id: string; score: number; payload: Record<string, unknown> }`.
- ✅ `apps/backend/src/vector-store/vector-store.constants.ts` — exports `RACE_RESULTS_COLLECTION = 'race_results'`, `QDRANT_CLIENT`, `EMBEDDING_DIMENSION = 1536`, `VECTOR_DISTANCE = 'Cosine'`.
- ✅ `apps/backend/src/vector-store/vector-store.service.spec.ts` — exists with 3 `upsert` tests; mock client currently only stubs `upsert`. New `query` tests must be ADDED, not replace existing ones.
- Qdrant client: `@qdrant/js-client-rest` v1.18. `search(collection_name, { vector, limit, with_payload, ... })` returns `Promise<Schemas['ScoredPoint'][]>`.
- `ScoredPoint`: `{ id: number | string; version: number; score: number; payload?: Record<string, unknown> | null; vector?: ... }`.

## Deliverables (definition of done)
1. `query(vector: number[], topK: number): Promise<QdrantResult[]>` is implemented (stub `Promise.reject` removed) and the parameters are used (no leading-underscore unused markers).
2. The method calls `this.client.search(RACE_RESULTS_COLLECTION, { vector, limit: topK, with_payload: true })` — collection from the constant, `limit` bound to `topK`, `with_payload: true`.
3. Each returned `ScoredPoint` is mapped to a `QdrantResult` with: `id: String(hit.id)`, `score: hit.score`, `payload: hit.payload ?? {}`.
4. The returned array preserves the order returned by the client (Qdrant returns descending by score).
5. `query` is `async` and `await`s the client call; errors from the client propagate unchanged (no try/catch swallowing).
6. Existing 3 `upsert` tests still pass unchanged.
7. New tests ADDED to `vector-store.service.spec.ts` in a `describe('VectorStoreService.query')` block covering:
   - **Happy path**: client returns ≥2 `ScoredPoint`s with payloads → asserts `search` called once with `(RACE_RESULTS_COLLECTION, { vector, limit: topK, with_payload: true })` and the mapped `QdrantResult[]` (ids stringified, scores and payloads carried through, order preserved).
   - **Empty result**: client resolves `[]` → method resolves `[]` (and `search` was still called once).
   - **Null/undefined payload**: a `ScoredPoint` with `payload: null` maps to `payload: {}`.
   - **Numeric id**: a `ScoredPoint` with `id: 42` (number) maps to `id: '42'` (string).
   - **Error case**: client `search` rejects → `query` rejects with the same error.
8. The spec file's `mockClient` is extended to include a `search: jest.fn()` mock; the existing `upsert` mock must remain.
9. `pnpm --filter backend lint` and `pnpm --filter backend test` both pass.

## Rules that must hold
- No `any` — use the existing `QdrantResult` type and `import type` for type-only imports.
- No magic strings — collection name comes from `RACE_RESULTS_COLLECTION`.
- Named exports only; do not modify `onModuleInit` or `upsert`.
- Errors from the client propagate unchanged — no try/catch swallowing.
- Do not log the raw vector (large/noisy); a debug log of result count is optional.

## Build steps
1. In `vector-store.service.ts`, replace the `query` stub with an `async` implementation: `await this.client.search(RACE_RESULTS_COLLECTION, { vector, limit: topK, with_payload: true })`, then map results.
2. Map `ScoredPoint[]` → `QdrantResult[]` using `String(hit.id)`, `hit.score`, `hit.payload ?? {}`. Return the mapped array.
3. In `vector-store.service.spec.ts`, add `search: jest.fn()` to `mockClient` (keep `upsert: jest.fn()`) and capture as `searchMock`.
4. Add `describe('VectorStoreService.query')` block with the 5 test cases from deliverable 7.
5. Run `pnpm --filter backend lint` and `pnpm --filter backend test`.

## Notes for the implementer
**Out of scope:** embedding generation, filtering by payload, `score_threshold`, pagination, `with_vector`, wiring into `RetrieveService` (step 32).

**Files to change:**
- `apps/backend/src/vector-store/vector-store.service.ts` (implement `query`)
- `apps/backend/src/vector-store/vector-store.service.spec.ts` (extend mock + add query tests)

**Mapping constraints:**
- `ScoredPoint.id` is `number | string` — always coerce with `String(...)`.
- `ScoredPoint.payload` is `Record<string, unknown> | null | undefined` — always use `?? {}`.
- Mock: `{ upsert: jest.fn(), search: jest.fn() } as unknown as QdrantClient`.

**Open question:** should `query` guard against `topK <= 0`? Not in scope — caller guarantees a valid positive value. Qdrant returns an empty array for `limit: 0`.