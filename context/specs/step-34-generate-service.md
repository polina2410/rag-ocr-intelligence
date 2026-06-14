# Implementation Task: GenerateService (LLM streaming) + shared OpenAiModule

## What to build
A `GenerateService` that opens a streaming OpenAI chat completion and exposes the response as an `AsyncGenerator<string>` yielding content token deltas. As part of this, extract a shared `OpenAiModule` (owning the `OPENAI_CLIENT` token) so a single OpenAI client instance is shared by both the existing `EmbedModule` and the new `GenerateModule`. No HTTP/SSE wiring and no prompt building in this step (those are steps 35 and 33 ✅).

## Current state
- `apps/backend/src/embed/embed.constants.ts` ✅ — exports `OPENAI_CLIENT = 'OPENAI_CLIENT'` and `EMBEDDING_MODEL = 'text-embedding-3-small'`.
- `apps/backend/src/embed/embed.module.ts` ✅ — registers `OPENAI_CLIENT` itself via `useFactory` (injects `ConfigService`, `new OpenAI({ apiKey: config.getOrThrow<string>('OPENAI_API_KEY') })`); also provides `RaceResultSerializerService` + `EmbedService`; exports only `EmbedService`.
- `apps/backend/src/embed/embed.service.ts` ✅ — injects `@Inject(OPENAI_CLIENT) private readonly client: OpenAI`; calls `this.client.embeddings.create(...)`; imports `{ EMBEDDING_MODEL, OPENAI_CLIENT }` from `./embed.constants.js`.
- `apps/backend/src/embed/embed.service.spec.ts` ✅ — standalone-const harness; constructs `new EmbedService(client, repo, serializer, vectorStore)` directly with a hand-rolled mock client; imports only `EMBEDDING_MODEL` from `./embed.constants.js` (NOT `OPENAI_CLIENT`).
- `apps/backend/src/prompt/prompt-builder.service.ts` ✅ — `buildMessages(query, chunks): OpenAI.Chat.Completions.ChatCompletionMessageParam[]`; uses `type ChatMessage = OpenAI.Chat.Completions.ChatCompletionMessageParam` via default `import type OpenAI from 'openai'`. This is the upstream producer of the messages GenerateService consumes.
- Packages: `openai@6.42.0`; NestJS; TypeScript with `nodenext`/ESM (`.js` import extensions); Jest + `@nestjs/testing` available but the unit-test convention here is the standalone-const harness (no `@nestjs/testing` for service unit tests).

## Deliverables (definition of done)
1. **New constant file** `apps/backend/src/openai/openai.constants.ts` — named export `OPENAI_CLIENT = 'OPENAI_CLIENT'` (string injection token), moved out of `embed.constants.ts`.
2. **`embed.constants.ts` updated** — `OPENAI_CLIENT` REMOVED; `EMBEDDING_MODEL` STAYS (it is embed-specific and co-located with its consumer).
3. **New `apps/backend/src/openai/openai.module.ts`** — `@Module` that provides the `OPENAI_CLIENT` token via the same `useFactory` (inject `ConfigService`, `new OpenAI({ apiKey: config.getOrThrow<string>('OPENAI_API_KEY') })`) and **exports** `OPENAI_CLIENT`. Class name `OpenAiModule`, named export.
4. **`embed.module.ts` refactored** — `imports` now includes `OpenAiModule`; the inline `OPENAI_CLIENT` factory provider is REMOVED from `providers`; `RaceResultSerializerService` + `EmbedService` providers and the `EmbedService` export are unchanged. The now-unused `ConfigService` and `OpenAI` imports are removed from this file.
5. **`embed.service.ts` import path updated** — `OPENAI_CLIENT` now imported from `../openai/openai.constants.js`; `EMBEDDING_MODEL` still from `./embed.constants.js`. No behavioral change.
6. **New `apps/backend/src/generate/generate.constants.ts`** — named export `CHAT_MODEL = 'gpt-4o-mini'` (FINAL decision: must be a named constant; implementer may confirm/change the value but not the form). Optionally MAY add `TEMPERATURE` / `MAX_TOKENS` named constants if used, but they are not required.
7. **New `apps/backend/src/generate/generate.service.ts`** — `@Injectable()` `GenerateService`; constructor `@Inject(OPENAI_CLIENT) private readonly client: OpenAI` (import `OPENAI_CLIENT` from `../openai/openai.constants.js`; `import type OpenAI from 'openai'`). Method:
   `generate(messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[]): AsyncGenerator<string>` — an `async *` generator that calls `this.client.chat.completions.create({ model: CHAT_MODEL, messages, stream: true })`, iterates the returned stream with `for await`, and `yield`s each `chunk.choices[0]?.delta?.content` that is a non-empty string. Errors propagate unwrapped (no try/catch swallow).
8. **New `apps/backend/src/generate/generate.module.ts`** — `@Module` that `imports: [OpenAiModule]`, `providers: [GenerateService]`, `exports: [GenerateService]`. Class name `GenerateModule`, named export.
9. **New `apps/backend/src/generate/generate.service.spec.ts`** — standalone-const harness (NOT `@nestjs/testing`) with the cases in "Build steps" §6 below, all passing.
10. **Whole suite green** — `pnpm --filter backend test` passes (new generate tests + unchanged embed tests) and `pnpm --filter backend build` + `pnpm --filter backend lint` succeed.

## Rules that must hold
- No `any`. Use SDK types and `unknown`/generics. `ChatCompletionMessageParam` accessed via the default `OpenAI` namespace (`import type OpenAI from 'openai'`), matching `prompt-builder.service.ts` — do NOT use the `openai/resources/...` subpath import (nodenext resolution).
- Named exports throughout; ESM `.js` import extensions on all relative imports; NestJS `module / service` structure.
- No magic strings/numbers — `CHAT_MODEL` and `OPENAI_CLIENT` are named constants.
- OpenAI access stays behind `GenerateService` (no controller in this step).
- Errors propagate unwrapped — match `EmbedService` (`rejects.toBe(error)` semantics).
- **Backward-compat (FINAL):** the `OpenAiModule` extraction must not change `EmbedService` behavior. A single shared client instance now serves embed + generate.
- Tests: standalone-const mock harness; capture every `jest.fn()` in a `const` and assert against the const — never assert against `obj.method` (backend lint enables `@typescript-eslint/unbound-method`).

## Build steps
1. Create `apps/backend/src/openai/openai.constants.ts` exporting `OPENAI_CLIENT`. Remove `OPENAI_CLIENT` from `apps/backend/src/embed/embed.constants.ts` (keep `EMBEDDING_MODEL`).
2. Create `apps/backend/src/openai/openai.module.ts` — `OpenAiModule` providing the `OPENAI_CLIENT` factory (moved verbatim from `embed.module.ts`) and exporting `OPENAI_CLIENT`.
3. Refactor `apps/backend/src/embed/embed.module.ts` — add `OpenAiModule` to `imports`; delete the inline `OPENAI_CLIENT` provider; remove the now-unused `ConfigService` and `OpenAI` imports.
4. Update `apps/backend/src/embed/embed.service.ts` import line so `OPENAI_CLIENT` comes from `../openai/openai.constants.js` and `EMBEDDING_MODEL` stays from `./embed.constants.js`.
5. Create `apps/backend/src/generate/generate.constants.ts` (`CHAT_MODEL`), `generate.service.ts`, and `generate.module.ts` per Deliverables 6–8.
6. Create `apps/backend/src/generate/generate.service.spec.ts` with a `setup()` harness that builds a mock OpenAI client where `chat.completions.create` is a captured `createFn` returning an **async-iterable** of fake `ChatCompletionChunk`-shaped objects (e.g. `{ choices: [{ delta: { content: 'foo' } }] }`). Construct `new GenerateService(client)` directly. Cases:
   - (a) `createFn` called once with exactly `{ model: CHAT_MODEL, messages, stream: true }`.
   - (b) For a multi-chunk stream, the generator yields each `delta.content` in order (collect via `for await` into an array; assert sequence, e.g. `['Hello', ' world']`).
   - (c) Chunks with `delta.content` of `null`, `undefined`, or `''` are skipped (interleave them between real deltas; assert they don't appear).
   - (d) An empty stream yields nothing (collected array is `[]`).
   - (e) Error propagation: when `createFn` rejects, iterating/draining the generator rejects with the same error (`rejects.toBe(error)`); also cover (or note) a mid-stream throw if the async iterable can throw while iterating.
   Build the fake async-iterable with an `async function*` helper (or an object with `[Symbol.asyncIterator]`); type the mock client as `... as unknown as OpenAI`.

## Notes for the implementer
**OpenAiModule migration (read carefully):** Only the shared **`OPENAI_CLIENT` token + its factory** move into `OpenAiModule`. `EMBEDDING_MODEL` stays in `embed`, `CHAT_MODEL` lives in `generate` — model-name constants stay next to their consumer; only the cross-cutting client token is shared. Every existing import of `OPENAI_CLIENT` (`embed.service.ts`, and the deleted reference in `embed.module.ts`) must be repointed to `../openai/openai.constants.js`. Grep for `OPENAI_CLIENT` after the change to confirm no stale `embed.constants` references remain.

**Why embed tests stay green:** `embed.service.spec.ts` constructs `EmbedService` directly with a hand-rolled mock client and imports only `EMBEDDING_MODEL` from `embed.constants.js` — it never touches the DI factory or `OPENAI_CLIENT`. The module refactor is DI-wiring only, so these tests are unaffected. Verify they still pass after step 4.

**Streaming reference (openai@6.42.0, stable v6 API — Context7 was unavailable this session):**
```typescript
const stream = await this.client.chat.completions.create({
  model: CHAT_MODEL,
  messages,
  stream: true,
});
for await (const chunk of stream) {
  const delta = chunk.choices[0]?.delta?.content; // string | null | undefined
  if (delta) {
    yield delta;
  }
}
```
`delta.content` may be `null`/`undefined` on role-only or terminal chunks — guard before yielding (the truthy check also correctly drops empty strings).

**Out of scope:** SSE / HTTP streaming (step 35), `POST /ask` endpoint (step 36), retrieval + prompt building (steps 32/33 ✅), token-usage accounting, retries/backoff, temperature/max_tokens tuning (optional named constants only), multi-turn history, function/tool calling.

**Files likely affected:**
- New: `apps/backend/src/openai/openai.constants.ts`, `apps/backend/src/openai/openai.module.ts`, `apps/backend/src/generate/generate.constants.ts`, `apps/backend/src/generate/generate.service.ts`, `apps/backend/src/generate/generate.module.ts`, `apps/backend/src/generate/generate.service.spec.ts`.
- Modified: `apps/backend/src/embed/embed.constants.ts`, `apps/backend/src/embed/embed.module.ts`, `apps/backend/src/embed/embed.service.ts`.
- `GenerateModule` is exported for step 35 to import; no `AppModule` registration is required by this step (do it now only if it does not break the build).

**Open questions:** None blocking. The three resolved decisions (shared `OpenAiModule`, `AsyncGenerator<string>` return shape, `CHAT_MODEL` named constant) are FINAL. The only soft point: the literal value `'gpt-4o-mini'` may be confirmed/changed by the implementer, but it must remain a named constant.