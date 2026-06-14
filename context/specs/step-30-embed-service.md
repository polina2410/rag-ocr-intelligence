# Implementation Task: EmbedService — Embed a Single Text Chunk via OpenAI

## What to build
A new NestJS `EmbedService` with one method, `embed(text: string): Promise<number[]>`, that calls the OpenAI embeddings API for a single text chunk (e.g. the string produced by `RaceResultSerializerService`) and returns the resulting vector as a plain `number[]`. The OpenAI client is injected via a custom DI token following the existing Qdrant pattern. This is single-chunk only — batching across a race is step 31.

## Current state
- No OpenAI client or service exists anywhere in the codebase yet.
- `openai` `^6.42.0` is already a dependency in `apps/backend/package.json`. Call shape: `client.embeddings.create({ input, model })` → `{ data: [{ embedding: number[], index: number, object }], model, object, usage }`. Vector is at `response.data[0].embedding`.
- `text-embedding-3-small` produces a 1536-dim vector; `EMBEDDING_DIMENSION = 1536` already exists in `apps/backend/src/vector-store/vector-store.constants.ts` — do not redefine that number.
- Pattern to follow — `apps/backend/src/vector-store/vector-store.module.ts`: registers `QDRANT_CLIENT` as a custom provider via `useFactory` + `inject: [ConfigService]`, reads config with `config.getOrThrow(...)`, exports both the token and the service.
- `apps/backend/src/serializer/race-result-serializer.service.ts` — `RaceResultSerializerService.serialize()` produces the `string` `EmbedService` consumes. It has no module file yet (not required for this step).
- `apps/backend/src/app.module.ts` imports `AthletesModule`, `IngestionModule`, `RacesModule`, `VectorStoreModule`. `EmbedModule` is NOT yet registered. `ConfigModule.forRoot({ isGlobal: true })` is already present, so `ConfigService` is injectable anywhere.
- Mock pattern for tests: `{ embeddings: { create: jest.fn() } } as unknown as OpenAI` (mirrors `as unknown as QdrantClient` in `vector-store.service.spec.ts`).

## Deliverables (definition of done)
1. `apps/backend/src/embed/embed.constants.ts` — exports `OPENAI_CLIENT` (injection token string const) and `EMBEDDING_MODEL = 'text-embedding-3-small'`.
2. `apps/backend/src/embed/embed.service.ts` — `@Injectable()` `EmbedService` with constructor `@Inject(OPENAI_CLIENT) private readonly client: OpenAI`, exposing `async embed(text: string): Promise<number[]>`.
3. `embed()` calls `client.embeddings.create({ input: text, model: EMBEDDING_MODEL })` and returns `response.data[0].embedding` — a plain `number[]`, not the wrapper object.
4. Errors from the OpenAI client propagate — no try/catch that swallows or returns a fallback.
5. `apps/backend/src/embed/embed.module.ts` — `EmbedModule` registers `OPENAI_CLIENT` via `useFactory` + `inject: [ConfigService]` instantiating `new OpenAI({ apiKey: config.getOrThrow<string>('OPENAI_API_KEY') })`; provides `EmbedService`; `exports: [EmbedService]` (client token is NOT exported — encapsulated inside the module).
6. `apps/backend/src/embed/embed.service.spec.ts` — Jest tests mocking the OpenAI client (no network calls), instantiating `new EmbedService(mockClient)`. Covers at minimum:
   - Happy path: `embeddings.create` called once with `{ input: <text>, model: 'text-embedding-3-small' }`; `embed()` resolves to the inner `embedding` array.
   - Error propagation: when `embeddings.create` rejects, `embed()` rejects with the same error.
7. `EmbedModule` added to the `imports` array of `apps/backend/src/app.module.ts`.
8. `pnpm --filter backend test` passes and `pnpm --filter backend build` succeeds.

## Rules that must hold
- No `any` — use OpenAI SDK types (`OpenAI`, SDK response types) for client and response.
- OpenAI client instantiated only in the module factory — never `new OpenAI()` inside `EmbedService`.
- Model name lives in a named constant, not an inline string literal at the call site.
- Return value is a plain `number[]` — callers never see the OpenAI response wrapper.
- API-call failures propagate unchanged; no silent swallowing, no default/zero vector.
- `OPENAI_API_KEY` read via `ConfigService.getOrThrow` (fail fast if missing); never hardcode or log the key.
- Relative imports use `.js` suffixes; all exports are named exports.
- Do not modify `vector-store.constants.ts` or `RaceResultSerializerService`.

## Build steps
1. Create `apps/backend/src/embed/embed.constants.ts` with `OPENAI_CLIENT` token and `EMBEDDING_MODEL`.
2. Create `apps/backend/src/embed/embed.service.ts` with the injected client and `embed()` method.
3. Create `apps/backend/src/embed/embed.module.ts` with the `OPENAI_CLIENT` factory provider, `EmbedService`, and exports.
4. Register `EmbedModule` in `apps/backend/src/app.module.ts` imports.
5. Write `apps/backend/src/embed/embed.service.spec.ts` mocking the client.
6. Run `pnpm --filter backend test` then `pnpm --filter backend build`; fix until green.

## Notes for the implementer
- **Out of scope:** batch embedding (step 31), embedding user queries / retrieval (step 32), wiring `EmbedService` into ingestion, retries/rate-limit/backoff, token-length validation/truncation.
- **New files:** `apps/backend/src/embed/embed.constants.ts`, `embed.service.ts`, `embed.module.ts`, `embed.service.spec.ts`. Edit: `apps/backend/src/app.module.ts`.
- **Empty-string input:** the OpenAI API rejects empty strings; that surfaces as a propagated API error — no client-side guard required.
- **`response.data[0].embedding`:** indexing directly is fine for single-input calls; `data` will always have exactly one entry.
- **Why not export `OPENAI_CLIENT` from `EmbedModule`:** steps 31 and 32 consume embeddings through `EmbedService`, not the raw client. Export the token later only if a concrete consumer needs it.