# Implementation Task: POST /ask Endpoint (RAG Pipeline Wiring)

## What to build
A `POST /ask` NestJS endpoint that orchestrates the full RAG pipeline: it retrieves relevant chunks, builds the chat prompt, then streams the OpenAI completion back to the client as Server-Sent Events (SSE) via the existing `writeSse` helper. Retrieve + prompt-building run (and surface errors as normal HTTP responses) before any streaming begins; client disconnect aborts the in-flight OpenAI request. This is the final step (36) of Phase 3.

## Current state
- `RetrieveService.retrieve(query: string, topK?: number): Promise<RetrievedChunk[]>` ✅ — `apps/backend/src/retrieve/retrieve.service.ts`. Defaults to `DEFAULT_TOP_K = 5`. Exported from `RetrieveModule`.
- `PromptBuilderService.buildMessages(query: string, chunks: RetrievedChunk[]): ChatMessage[]` ✅ — `apps/backend/src/prompt/prompt-builder.service.ts`. Pure; emits a no-context instruction when chunks lack usable `text`. Exported from `PromptModule`.
- `GenerateService.generate(messages: ChatMessage[]): AsyncGenerator<string>` ✅ — `apps/backend/src/generate/generate.service.ts`. `type ChatMessage = OpenAI.Chat.Completions.ChatCompletionMessageParam`. Currently calls `this.client.chat.completions.create({ model: CHAT_MODEL, messages, stream: true })`. Exported from `GenerateModule` (imports `OpenAiModule`). **Not yet in the DI graph anywhere.**
- `writeSse(res: Response, tokens: AsyncIterable<string>, onClose?: () => void): Promise<void>` ✅ — `apps/backend/src/common/sse/sse-stream.ts`. Standalone exported function (NOT a provider). `Response` from `express`. Sets SSE headers, JSON-encodes each token into a `data:` frame, emits a terminal `done` event, catches mid-stream errors into a safe `error` event, and fires `onClose` once if the client disconnects before completion. Resolves normally even on error.
- `RetrievedChunk` (from retrieve.service.ts): `{ id: string; score: number; metadata: RaceResultPayload }`.
- `app.module.ts` ✅ — `apps/backend/src/app.module.ts`. Feature modules imported with `.js` extensions (`./races/races.module.js`, etc.). `GenerateModule`, `RetrieveModule`, `PromptModule` are NOT currently imported here.
- `main.ts` ✅ — global `ValidationPipe({ whitelist: true, forbidNonWhitelisted: true })`. No `transform: true` (irrelevant here; `AskQueryDto` has no transforms).
- DTO reference style: `apps/backend/src/races/dto/list-races-query.dto.ts` (class-validator + named-constant caps + `@ApiProperty`/`@ApiPropertyOptional`).
- Controller reference style: `apps/backend/src/races/races.controller.ts` (thin; delegates; `@ApiTags`/`@ApiOperation`/response decorators per endpoint).
- Test harness reference: `apps/backend/src/generate/generate.service.spec.ts` (standalone-const `setup`/`Harness`, `jest.fn()`s captured in consts).
- Packages: NestJS, `@nestjs/swagger`, `class-validator`, `class-transformer`, `openai` SDK, Jest + `@nestjs/testing`. ESM with `.js` relative imports.

## Deliverables (definition of done)
1. **Modify `GenerateService.generate`** — new signature `generate(messages: ChatMessage[], signal?: AbortSignal): AsyncGenerator<string>`. Pass `signal` as the OpenAI request **options** (2nd arg), NOT in the body:
   `await this.client.chat.completions.create({ model: CHAT_MODEL, messages, stream: true }, { signal })`.
   No behavior change when `signal` is omitted. `signal` is optional so existing call sites still compile.
2. **Update `apps/backend/src/generate/generate.service.spec.ts`** — all existing tests still pass (the existing `toHaveBeenCalledWith({ model, messages, stream: true })` assertion may need to become `toHaveBeenCalledWith({ model, messages, stream: true }, ...)` or use `expect.anything()`/`undefined` for the options arg; adjust minimally). Add ONE new test: when a `signal` is passed to `generate`, `create` is called with the options arg containing that signal (e.g. `expect(createFn).toHaveBeenCalledWith(expect.anything(), { signal })`).
3. **New `apps/backend/src/ask/dto/ask-query.dto.ts`** — exported `AskQueryDto` class with a single `query: string` field validated by `@IsString()`, `@IsNotEmpty()`, and `@MaxLength(MAX_QUERY_LENGTH)` where `MAX_QUERY_LENGTH` is a named constant (`= 1000`). `@ApiProperty({ ... })` describing the field. Mirror the style of `list-races-query.dto.ts`.
4. **New `apps/backend/src/ask/ask.controller.ts`** — `@ApiTags('ask')`, `@Controller('ask')`, `@Post()` handler:
   `ask(@Body() dto: AskQueryDto, @Res() res: Response): Promise<void>`.
   Orchestration, in this exact order:
   - `const chunks = await this.retrieve.retrieve(dto.query);`
   - `const messages = this.promptBuilder.buildMessages(dto.query, chunks);`
   - `const controller = new AbortController();`
   - `await writeSse(res, this.generate.generate(messages, controller.signal), () => controller.abort());`
   `@ApiOperation` (+ `@ApiBody({ type: AskQueryDto })`) whose summary/description states the response is a `text/event-stream` of `data:`-framed JSON token strings terminated by a `done` event (Swagger cannot model the streaming body — describe it in prose). `import type { Response } from 'express'`. Handler returns `void` and must NOT also return a body — `writeSse` owns ending the response.
5. **New `apps/backend/src/ask/ask.module.ts`** — `@Module` importing `RetrieveModule`, `PromptModule`, `GenerateModule`; `controllers: [AskController]`. See "logic-in-controller vs AskService" recommendation in the notes — default: **logic in the controller, no providers** (matches the thin-controller convention; the controller is still fully unit-testable by direct construction).
6. **Register `AskModule` in `app.module.ts`** imports — `import { AskModule } from './ask/ask.module.js';` with the `.js` extension (matches sibling feature-module imports). This also brings `GenerateModule` online for the first time.
7. **New `apps/backend/src/ask/ask.controller.spec.ts`** — standalone-const harness (construct the controller directly with `jest.fn()`-backed deps; do NOT use the Nest testing module unless needed). `jest.mock('../common/sse/sse-stream.js', ...)` to spy on `writeSse`. Capture every `jest.fn()` in a const (satisfies `unbound-method`). Assert:
   - (a) `retrieve.retrieve` called with `dto.query`;
   - (b) `buildMessages` called with `(dto.query, chunks)` (the chunks returned by `retrieve`);
   - (c) `generate.generate` called with `(messages, <an AbortSignal>)` (assert 2nd arg `instanceof AbortSignal` / `expect.any(AbortSignal)`);
   - (d) `writeSse` called with `(res, <the generator>, <a function>)`;
   - (e) if `retrieve.retrieve` rejects, the handler promise rejects with that error AND `writeSse` is NOT called (pre-stream error path).
   Satisfy `require-await` (the harness async helpers must contain an `await` or be non-async).
8. **Validation behavior (verifiable):**
   - Missing or empty `query` → HTTP **400** via the global `ValidationPipe` (`@IsNotEmpty`).
   - `query` longer than `MAX_QUERY_LENGTH` → HTTP **400** (`@MaxLength`).
   - Any extra body property → HTTP **400** (`forbidNonWhitelisted`).
9. **`pnpm --filter backend lint`, `pnpm --filter backend test`, and `pnpm --filter backend build` all pass.**

## Rules that must hold
- No `any`. Use `unknown`/proper generics. Messages typed via the `OpenAI` namespace (`OpenAI.Chat.Completions.ChatCompletionMessageParam`).
- `Response` imported via `import type { Response } from 'express'`.
- Named exports only. Standard NestJS structure: `module / controller / dto`.
- DTO validated with class-validator; Swagger decorators present on the DTO field and the endpoint.
- ESM `.js` relative imports throughout (matches recent modules). `AskModule` registered in `app.module.ts` with `.js`.
- `@Res()` disables Nest's automatic response handling — the handler MUST return `void` and let `writeSse` end the response. Do not call `res.json`/`res.send` in the handler.
- `AbortSignal` goes in the OpenAI request **options** (2nd arg) — never in the request body.
- Orchestration order is load-bearing: `retrieve` (await) + `buildMessages` (sync) run BEFORE `writeSse`. Their throws must propagate so Nest's exception filters return JSON 4xx/5xx (response not yet committed). Do NOT start `writeSse` until both succeed.
- Tests: standalone-const harness; `jest.mock` the `sse-stream.js` free function; capture all `jest.fn()`s in consts; satisfy `require-await`/`unbound-method`.
- Do not modify retrieve/prompt/generate core logic beyond adding the `signal` parameter to `generate`.

## Build steps
1. Edit `generate.service.ts`: add `signal?: AbortSignal` param and pass `{ signal }` as the `create` options arg (Deliverable 1).
2. Update `generate.service.spec.ts`: fix the existing `toHaveBeenCalledWith` assertion to tolerate the new options arg; add the signal-forwarding test (Deliverable 2).
3. Create `apps/backend/src/ask/dto/ask-query.dto.ts` with `AskQueryDto` + `MAX_QUERY_LENGTH` (Deliverable 3).
4. Create `apps/backend/src/ask/ask.controller.ts` with the orchestration + Swagger decorators (Deliverable 4).
5. Create `apps/backend/src/ask/ask.module.ts` importing the three feature modules + registering the controller (Deliverable 5).
6. Register `AskModule` in `app.module.ts` imports with `.js` (Deliverable 6).
7. Create `apps/backend/src/ask/ask.controller.spec.ts` with the mocked `writeSse` and the assertions above (Deliverable 7).
8. Run `pnpm --filter backend lint && pnpm --filter backend test && pnpm --filter backend build`; fix until green (Deliverable 9).

## Notes for the implementer

**Abort wiring (the carried-over step-35 fix).** The controller creates one `AbortController` per request, passes `controller.signal` to `generate`, and passes `() => controller.abort()` as `writeSse`'s `onClose`. `writeSse` fires `onClose` exactly once when the client disconnects before completion → the OpenAI SDK sees the aborted signal and tears down the in-flight request immediately, rather than continuing to next token boundary.

**Known minor issue (call out, keep OPTIONAL — do not fix in step 36 unless trivial).** On client disconnect, `controller.abort()` makes the OpenAI SDK throw an abort error inside `generate`. `writeSse` catches it, but by then `closed === true`, so nothing is written/ended — correct behavior. However, `writeSse`'s `catch` block unconditionally calls `logger.error('SSE stream failed', ...)`, so every normal cancellation logs an error (log noise). OPTIONAL refinement for a future step: in `writeSse`, log at `debug` instead of `error` when `closed` is already true (or detect abort errors specifically), OR have the controller/generator swallow abort errors. Keep step 36 focused — do NOT expand scope to change `writeSse` unless you choose the one-line log-level guard.

**Logic-in-controller vs AskService (recommendation: logic-in-controller).** The orchestration is three straight-line delegations with no branching/transformation, matching the repo's thin-controller convention (`races.controller.ts`). The controller is fully unit-testable by direct construction with mocked deps + a mocked `writeSse`, so a separate `AskService` adds indirection without testability gain. Default to no providers. If a reviewer prefers, a thin `AskService.ask(query, res)` is acceptable but not required.

**Edge case — empty retrieval.** When races are unmigrated (no `text` payload), `retrieve` may return chunks whose `metadata.text` is empty (or an empty array). `buildMessages` already falls back to the no-context instruction, and `generate` still runs — the model answers "I don't have that information." The endpoint must work end-to-end with zero usable context (no crash, normal SSE stream).

**Edge case — pre-stream errors.** An OpenAI embeddings failure inside `retrieve` (or any `retrieve`/`buildMessages` throw) happens before `writeSse` is called, so it propagates to Nest's exception filter → normal JSON 5xx/4xx. Do NOT wrap these in SSE. This is why orchestration order matters and is asserted in test (e).

**Swagger limitation.** `@nestjs/swagger` cannot represent a `text/event-stream` body. Document the streaming contract (token `data:` frames + terminal `done` event, plus possible `error` event) in `@ApiOperation`'s `description`. `@ApiBody({ type: AskQueryDto })` covers the request.

**DI graph note.** Registering `AskModule` pulls `GenerateModule` (and `OpenAiModule`) into the DI graph for the first time. Ensure `GenerateModule` exports `GenerateService` and imports `OpenAiModule` (already true ✅) so resolution succeeds at boot.

**Out of scope (do NOT implement):** Frontend `/ask` page, `useSSE` hook, fetch client (Phase 4). Bull queue / background jobs (steps 37–39). Conversation history / multi-turn, auth, rate limiting, SSE heartbeats, reconnection. Exposing `topK` in the request (v1 uses `DEFAULT_TOP_K`). Token-budget context truncation. Changes to retrieve/prompt/generate logic beyond the `signal` addition.

**Open questions:** None — all decisions resolved upstream and confirmed against current source. The only deliberately-deferred item is the optional `writeSse` abort-log-noise refinement noted above.