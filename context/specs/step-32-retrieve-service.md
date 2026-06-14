# Implementation Task: RetrieveService

## What to build
A `RetrieveService` that takes a natural-language user query, embeds it via the existing `EmbedService`, and returns the top-k most similar race-result chunks from Qdrant with their stored payload metadata. This is the retrieval half of the RAG pipeline; it does not build prompts or call an LLM.

## Current state
- `apps/backend/src/embed/embed.service.ts` — `EmbedService.embed(text: string): Promise<number[]>` already exists and is exported from `EmbedModule`.
- `apps/backend/src/vector-store/vector-store.service.ts` — `VectorStoreService.query(vector: number[], topK: number): Promise<QdrantResult[]>` already exists and is exported from `VectorStoreModule`. `QdrantResult = { id: string; score: number; payload: Record<string, unknown> }`.
- `apps/backend/src/embed/embed.module.ts` — exports `EmbedService`; imports `VectorStoreModule`.
- `apps/backend/src/vector-store/vector-store.module.ts` — exports `VectorStoreService` and `QDRANT_CLIENT`.
- Qdrant payload shape stored per point: `{ raceResultId, raceId, athleteId, athleteName, raceName, raceDate }` (all strings; `raceDate` stored as the entity's `race.date` value).
- No `retrieve/` module exists yet.
- Test convention: plain Jest with hand-rolled mock dependencies passed to the service constructor (see `embed.service.spec.ts`), not `@nestjs/testing`.
- ESM imports use `.js` extensions throughout backend.

## Deliverables (definition of done)
1. New directory `apps/backend/src/retrieve/`.
2. `retrieve.service.ts` exporting `@Injectable() RetrieveService` with a single public method `retrieve(query: string, topK?: number): Promise<RetrievedChunk[]>`.
3. A shared, exported `RaceResultPayload` interface defining the Qdrant payload contract (`raceResultId`, `raceId`, `athleteId`, `athleteName`, `raceName`, `raceDate` — all `string`). Declare it in `vector-store.service.ts` (alongside `QdrantPoint`/`QdrantResult`) so it is reusable. Update `EmbedService.batchEmbedRace` to type the payload it builds as `RaceResultPayload` so the upsert and retrieve sides share one source of truth (prevents key drift).
4. An exported interface `RetrievedChunk` with the typed shape: `{ id: string; score: number; metadata: RaceResultPayload }`. `RetrieveService.retrieve` maps each `QdrantResult` into a `RetrievedChunk`, performing the `Record<string, unknown>` → `RaceResultPayload` conversion exactly once, at this boundary. No `unknown` leaks to callers. (Decision resolved — do NOT return raw `QdrantResult[]`; see Notes for rationale.)
5. `retrieve.service` embeds the query exactly once per call via `EmbedService.embed(query)` and passes the resulting vector to `VectorStoreService.query(vector, topK)`.
6. A named constant `DEFAULT_TOP_K = 5` (no magic number) used as the default when `topK` is not provided.
7. `retrieve.module.ts` exporting `RetrieveModule` that imports `EmbedModule` and `VectorStoreModule`, provides `RetrieveService`, and exports `RetrieveService`.
8. `retrieve.service.spec.ts` with Jest tests covering: (a) happy path — embed called once with the query, query called with the embedding and resolved topK, each hit mapped to a `RetrievedChunk` with `id`, `score`, and typed `metadata`; (b) default topK is used when omitted; (c) explicit topK overrides the default; (d) errors from `EmbedService.embed` propagate unwrapped; (e) empty result set from Qdrant returns an empty array without error.
9. `pnpm --filter backend lint` and `pnpm --filter backend test` both pass (the latter must still pass `embed.service.spec.ts` after the `RaceResultPayload` typing change).

## Rules that must hold
- Follow NestJS module structure (`module / service`, plus `dto/` only if a DTO is introduced).
- No `any`; use `unknown` or proper generics/typed interfaces.
- Named exports for backend service/module/types.
- No magic numbers — `topK` default must be a named constant.
- OpenAI calls must go only through `EmbedService` — do not inject `OPENAI_CLIENT` or call the OpenAI SDK directly here.
- Qdrant access must go only through `VectorStoreService` — do not inject `QDRANT_CLIENT` directly.
- ESM `.js` import extensions, matching the rest of the backend.
- Backward-compat: do not modify the signatures of `EmbedService.embed` or `VectorStoreService.query`. Typing the existing inline payload in `batchEmbedRace` as `RaceResultPayload` is allowed and expected, but must not change the payload's runtime shape.
- The `Record<string, unknown>` → `RaceResultPayload` conversion happens once, inside `RetrieveService.retrieve`. Do not push untyped payload access onto downstream consumers (step 33+).
- Do not register `RetrieveModule` in `app.module.ts` as part of this step — wiring to a controller is step 36, out of scope.

## Build steps
1. Add the `RaceResultPayload` interface to `vector-store.service.ts` (next to `QdrantPoint`/`QdrantResult`) and export it.
2. Update `EmbedService.batchEmbedRace` to type the `payload` it constructs as `RaceResultPayload` (no runtime change). Confirm `embed.service.spec.ts` still passes.
3. Create `apps/backend/src/retrieve/retrieve.service.ts`. Define `DEFAULT_TOP_K = 5` and the `RetrievedChunk` interface (`{ id; score; metadata: RaceResultPayload }`). Inject `EmbedService` and `VectorStoreService` via constructor.
4. Implement `retrieve(query, topK = DEFAULT_TOP_K)`: call `this.embed.embed(query)`, then `this.vectorStore.query(vector, topK)`, then map each `QdrantResult` to a `RetrievedChunk` — asserting `payload` to `RaceResultPayload` at this single boundary.
5. Create `apps/backend/src/retrieve/retrieve.module.ts` importing `EmbedModule` and `VectorStoreModule`, providing and exporting `RetrieveService`.
6. Create `apps/backend/src/retrieve/retrieve.service.spec.ts` following the mock-by-constructor pattern from `embed.service.spec.ts`. Mock `EmbedService` and `VectorStoreService`.
7. Run `pnpm --filter backend lint` and `pnpm --filter backend test`; fix until green.

## Notes for the implementer
**Out of scope:**
- Prompt building (step 33), LLM generation (step 34), SSE (step 35), and the `POST /ask` endpoint (step 36).
- Any HTTP controller, request DTO validation, or route — there is no endpoint in this step.
- Filtering by metadata (e.g. by `raceId` or `athleteId`), re-ranking, score thresholds, deduplication, and pagination.
- Query preprocessing/normalization (trimming, lowercasing, stopwords).

**Why typed `RetrievedChunk` (decision rationale):**
- The conversion from Qdrant's `payload: Record<string, unknown>` to a known shape has to happen somewhere. Returning raw `QdrantResult[]` pushes that unsafe access onto every consumer (step 33's prompt builder and beyond), violating the no-`unknown`-leakage rule and duplicating casts.
- Mapping to `RetrievedChunk` does the assertion once, at the `RetrieveService` boundary — the standard "normalize at the boundary" pattern.
- Sharing `RaceResultPayload` between the upsert side (`EmbedService`) and the retrieve side prevents silent key drift if a payload field is ever renamed.
- `score` is kept separate from `metadata` because it is Qdrant relevance data, not domain data, and downstream code will treat them differently (e.g. ordering by score vs. rendering metadata).

**Edge cases:**
- Empty/whitespace-only query: for MVP, pass through to `EmbedService` (no special handling).
- Qdrant returns fewer than `topK` results (including zero) — must return whatever is available, not throw.
- The `payload` → `RaceResultPayload` assertion at the boundary must not use `any`. A typed cast is acceptable for MVP since upsert and retrieve share `RaceResultPayload`; defensive per-field validation is not required this step.

**Resolved decisions:**
1. Return shape: typed `RetrievedChunk` `{ id; score; metadata: RaceResultPayload }` — RESOLVED, see rationale above.
2. `DEFAULT_TOP_K = 5` — RESOLVED.
3. Upper bound on `topK`: deferred to the endpoint layer (step 36) — RESOLVED.
4. Empty/whitespace query: pass through for MVP — RESOLVED.

**Open flag for step 33 (not actionable here):**
- The stored Qdrant payload does **not** include the serialized natural-language chunk text — only IDs, athlete/race names, and date. The prompt builder (step 33) needs the actual chunk text for the LLM context, so it will have to either re-serialize from Postgres via `raceResultId` or the payload will need a `text` field added at upsert time. `RetrievedChunk` as specced is sufficient for retrieval/metadata but **not** for context text. Flag this when starting step 33 so it isn't a surprise.