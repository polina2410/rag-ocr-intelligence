# Implementation Task: Prompt Builder (RAG Context Assembly)

## What to build
A pure NestJS service that assembles an OpenAI Chat Completions message array from a user query and the retrieved context chunks, ready for the step-34 GenerateService to pass to the LLM. As a prerequisite, add the serialized chunk `text` to the Qdrant payload at upsert time so each `RetrievedChunk` carries the natural-language text the builder needs.

## Current state
- `apps/backend/src/vector-store/vector-store.service.ts` — ✅ exports `RaceResultPayload` (fields: `raceResultId`, `raceId`, `athleteId`, `athleteName`, `raceName`, `raceDate`). Has NO `text` field yet.
- `apps/backend/src/embed/embed.service.ts` — ✅ `batchEmbedRace` already computes `const chunk = this.serializer.serialize(result)` then embeds it; `chunk` is currently discarded after embedding. Builds a `RaceResultPayload` (no `text`).
- `apps/backend/src/embed/embed.service.spec.ts` — ✅ standalone-const harness; asserts payload via `toMatchObject` (no `text` yet).
- `apps/backend/src/retrieve/retrieve.service.ts` — ✅ exports `DEFAULT_TOP_K = 5` and `RetrievedChunk { id; score; metadata: RaceResultPayload }`. `retrieve(query, topK?)` returns `RetrievedChunk[]`.
- `apps/backend/src/serializer/race-result-serializer.service.ts` — ✅ `serialize(result): string` (pure, synchronous).
- `apps/backend/src/prompt/` — does NOT exist yet. New module to create.
- Backend: NestJS, TypeScript ESM (`.js` import extensions), Jest, OpenAI SDK (`openai` package, type `ChatCompletionMessageParam`).

## Deliverables (definition of done)
1. **`RaceResultPayload` gains `text: string`** — added to the interface in `vector-store.service.ts`. Additive, placed alongside existing fields.
2. **`EmbedService.batchEmbedRace` populates `text: chunk`** in the `payload` object literal (the `chunk` variable already exists on the line above — no recomputation).
3. **`embed.service.spec.ts` updated** — the `points[0]` `payload` assertion in `toMatchObject` includes `text: 'text chunk'` (matching the harness's `serialized` value).
4. **New `apps/backend/src/prompt/prompt-builder.service.ts`** — `@Injectable()` named-exported `PromptBuilderService` with a single pure method:
   `buildMessages(query: string, chunks: RetrievedChunk[]): ChatCompletionMessageParam[]`
   - Returns a 2-element array: a `system` message (instructions + assembled context) and a `user` message (the raw `query`).
   - Context section is built by joining each chunk's `metadata.text` in array order, each clearly delimited (e.g. numbered or separated by a constant delimiter).
   - No constructor dependencies (or none beyond DI symmetry — prefer zero). No DB, no network, no OpenAI client.
5. **New `apps/backend/src/prompt/prompt.module.ts`** — declares `PromptBuilderService` in `providers` and `exports` so step-34 can inject it.
6. **Named constants** for all fixed strings/limits: the base system instruction text, the no-data instruction text, and the context delimiter. No magic strings inline, no magic numbers (the expected message count of 2, if asserted, is a named constant).
7. **Empty-context handling** — when `chunks` is empty (or after filtering, no usable text remains), the system message contains the no-data instruction directing the model to state it lacks the data and NOT to hallucinate; no context block is emitted.
8. **Missing/empty-text tolerance** — a chunk whose `metadata.text` is `undefined` or empty string MUST NOT crash the builder; such chunks are skipped from the context block (they may exist for races ingested before deliverable 1/2 — see migration note).
9. **New `apps/backend/src/prompt/prompt-builder.service.spec.ts`** (standalone-const harness, NOT `@nestjs/testing`) covering:
   - Each chunk's `text` appears in the system message, in input array order.
   - The `query` appears verbatim in the `user` message.
   - Empty `chunks` array → system message contains the no-data instruction and no context block.
   - A chunk with missing/empty `text` is skipped without throwing; remaining chunks still appear.
   - Output shape: array length is 2, `[0].role === 'system'`, `[1].role === 'user'`.

## Rules that must hold
- No `any` — use `unknown`/generics. The OpenAI message type is `ChatCompletionMessageParam` imported as a `type` from `openai`.
- Named exports only. ESM `.js` import extensions on all relative imports.
- NestJS module/service structure (`prompt.module.ts` + `prompt-builder.service.ts` + `.spec.ts`).
- **Prompt builder is PURE**: a deterministic function of `(query, chunks)` only — assert this by having zero injected repositories/clients. Same inputs always yield identical output.
- No magic numbers/strings — extract named constants for instruction text, delimiter, and any counts.
- Backward-compat: adding `text` to the payload is additive; existing code that constructs/reads `RaceResultPayload` continues to compile (every field stays required, but the builder must tolerate `text` being absent at runtime on older points).
- Tests use the standalone-const jest mock harness pattern. The builder is pure, so likely no mocks are needed — construct `PromptBuilderService` directly. Never assert against `obj.method` references (lint enables `@typescript-eslint/unbound-method`); if any `jest.fn()` is ever used, capture it in a const.

## Build steps
1. Add `text: string;` to the `RaceResultPayload` interface in `vector-store.service.ts`.
2. In `embed.service.ts` `batchEmbedRace`, add `text: chunk,` to the `payload` literal.
3. Update `embed.service.spec.ts`: add `text: 'text chunk'` to the `points[0].payload` `toMatchObject` block.
4. Create `apps/backend/src/prompt/prompt.constants.ts` (or inline consts in the service): `SYSTEM_INSTRUCTION`, `NO_CONTEXT_INSTRUCTION`, `CONTEXT_DELIMITER`, and the expected `MESSAGE_COUNT` if used in tests.
5. Create `prompt-builder.service.ts` with `PromptBuilderService.buildMessages`: filter chunks to those with non-empty `metadata.text`, join into a context block (or use the no-data instruction when none remain), assemble system + user messages, return the typed array.
6. Create `prompt.module.ts` providing and exporting `PromptBuilderService`.
7. Create `prompt-builder.service.spec.ts` covering all cases in deliverable 9.
8. Run `pnpm --filter backend lint` and `pnpm --filter backend test` — both green before marking done.

## Notes for the implementer
**Output-shape decision (FINAL — recommended):** Return `ChatCompletionMessageParam[]` (a `system` message carrying instructions + assembled context, and a `user` message carrying the raw query), NOT a decoupled `{ system; user }` object. Rationale: step-34 GenerateService passes `messages` straight to `client.chat.completions.create({ messages })`, so this avoids an adapter layer and keeps the contract aligned with the OpenAI SDK. It stays fully testable — the array is a plain serializable value, and the system content is a string you can assert substrings against. (If a future step wants provider-agnostic prompts, that abstraction can wrap this; do not build it now.)

**Migration note:** Races ingested before deliverables 1–2 were upserted WITHOUT `text` in their Qdrant payload. Their `RetrievedChunk.metadata.text` will be `undefined` at runtime. Backfilling requires re-running ingestion / `batchEmbedRace` for those races. The prompt builder MUST tolerate this (deliverable 8) — never assume `text` is present.

**Edge cases handled here:** empty `chunks` (no-data instruction), chunks with missing/empty `text` (skipped). If ALL chunks lack usable text, treat it as the empty-context case (no-data instruction).

**Out of scope (do NOT build):** the LLM call / streaming (step-34 GenerateService), SSE (35), `POST /ask` (36), re-ranking, score thresholds, and token-budget truncation of the context block. Token-budget truncation is a known future concern — note it in a code comment but do not implement.

**Open questions:** none blocking. The architectural decision (store `text` in payload; pure builder reading `chunk.metadata.text`) is final.