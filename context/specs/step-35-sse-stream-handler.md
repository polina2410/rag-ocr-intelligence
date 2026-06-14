# Implementation Task: SSE Stream Handler (writeSse helper)

## What to build
A reusable, framework-light Server-Sent Events writer: a single standalone exported async function that takes an Express `Response` and an `AsyncIterable<string>` of tokens and streams them to the client as SSE frames. It is NOT a NestJS provider, module, or controller — step 36 (`POST /ask`) will import and call it. This step delivers the writer and its unit tests only.

## Current state
- Backend: NestJS 11 on `@nestjs/platform-express` (^11) — raw response is Express `Response` (`import type { Response } from 'express'`).
- `GenerateService.generate(messages): AsyncGenerator<string>` ✅ (step 34) — `apps/backend/src/generate/generate.service.ts`. This is the upstream token source step 36 will pass in; per OpenAI streaming, errors can throw mid-iteration. The helper depends only on the more general `AsyncIterable<string>` and MUST NOT import this service.
- Error-handling convention ✅ — `apps/backend/src/ingestion/ingestion.service.ts`: instantiate `private readonly logger = new Logger(<Name>)`; on failure call `logger.error(<message>, error instanceof Error ? error.stack : String(error))` and surface only a safe/generic message to the client.
- ESM import-extension convention: sibling `generate` module uses `.js` extensions on relative imports (`'./generate.constants.js'`). Follow `.js` here.
- Test harness convention ✅ — `apps/backend/src/generate/generate.service.spec.ts`: standalone-const harness, every `jest.fn()` captured in a const, fake `async function*` sources, a `drain`-style helper.
- Lint: backend ESLint enables `@typescript-eslint/unbound-method` (never assert against `obj.method` — capture the `jest.fn()` const) and `require-await` (every async function body must contain an `await`).
- No `apps/backend/src/common/sse/` directory exists yet — this step creates it.

## Deliverables (definition of done)
1. New file `apps/backend/src/common/sse/sse-stream.ts` exporting a named async function with this exact signature:
   `export async function writeSse(res: Response, tokens: AsyncIterable<string>): Promise<void>`
   - `res` typed via `import type { Response } from 'express'`.
   - `tokens` typed `AsyncIterable<string>` (NOT `AsyncGenerator`, NOT `GenerateService`).
   - Returns `Promise<void>`; never throws out to the caller (see deliverable 6).
2. New file `apps/backend/src/common/sse/sse-stream.constants.ts` exporting named constants — no inline magic strings/numbers anywhere in `sse-stream.ts`. Minimum set:
   - SSE response headers (as a typed record or individual consts): `Content-Type: text/event-stream`, `Cache-Control: no-cache`, `Connection: keep-alive`, `X-Accel-Buffering: no`.
   - SSE field labels used to build frames: the `data:` field prefix, the `event:` field prefix, the frame terminator (`\n\n`).
   - The done event name (`done`) and done sentinel payload (`[DONE]`).
   - The error event name (`error`).
   - The safe client-facing error message (a generic string, e.g. `Stream failed`).
   - The `'close'` event name for the disconnect listener.
   Constants imported into `sse-stream.ts` via a `.js` extension import.
3. Before the first data write, `writeSse` sets all four headers and calls `res.flushHeaders()` exactly once, so the client observes the open stream immediately. Headers are set before any `data:` frame.
4. Each token from `tokens`, in iteration order, is written as exactly one frame: `data: ${JSON.stringify(token)}\n\n` (JSON-encode so embedded newlines/quotes/control chars cannot break SSE framing). No token transformation, filtering, or batching.
5. On normal completion (iterable exhausted), write one terminal frame `event: done\ndata: [DONE]\n\n` (built from constants), then call `res.end()` exactly once.
6. Mid-stream error path: if iterating `tokens` throws, catch it, call `logger.error(...)` with the full error server-side (stack via `error instanceof Error ? error.stack : String(error)`), then — only if the connection is still open — write one safe frame `event: error\ndata: ${JSON.stringify(SAFE_ERROR_MESSAGE)}\n\n` and call `res.end()`. Do NOT include `error.message` or any internal detail in the client frame. Do NOT rethrow after the response is committed — `writeSse` resolves normally.
7. Client-disconnect path: register `res.on('close', ...)` (using the `'close'` constant) that flips an internal "closed" flag. The iteration loop checks this flag and `break`s when set, so the upstream async generator's `.return()` cleanup runs (aborting the LLM request in step 36). All writes (`data`, `done`, `error`) are guarded so nothing is written after the connection is closed / response ended. `res.end()` is not called again if already ended/closed.
8. Unit tests in `apps/backend/src/common/sse/sse-stream.spec.ts` using the standalone-const harness (a `setup` that returns a mocked `Response` with `setHeader`/`flushHeaders`/`write`/`end`/`on` each captured as its own `jest.fn()` const, plus a fake `async function*` token source helper). Required cases:
   - (a) headers set AND `flushHeaders` called before the first `write` (assert call ordering, e.g. via `mock.invocationCallOrder` or by asserting no `data:` write preceded `flushHeaders`).
   - (b) tokens written as ordered JSON `data:` frames — assert exact frame strings including `JSON.stringify` of a token containing a newline/quote.
   - (c) on completion: `done` frame written, then `end()` called exactly once.
   - (d) empty stream: headers + `flushHeaders` + `done` frame + `end()`, and zero `data:` frames.
   - (e) source throws mid-stream: full error logged (spy on `Logger.prototype.error`), a safe `error` frame written (assert it does NOT contain the thrown message), `end()` called, and `writeSse` resolves without throwing.
   - (f) client `'close'` mid-stream: trigger the captured `close` handler partway through iteration; assert iteration stops (no further `data:` frames) and no writes occur after close.
9. `pnpm --filter backend lint`, `pnpm --filter backend test`, and `pnpm --filter backend build` all pass.

## Rules that must hold
- No `any`. `res: Response` via `import type { Response } from 'express'`; tokens `AsyncIterable<string>`.
- Named exports only. ESM relative imports use `.js` extensions.
- No magic strings/numbers — all SSE field labels, header names/values, event names, sentinel, and safe error message live in `sse-stream.constants.ts`.
- Errors: log full detail server-side via Nest `Logger`; emit only the safe generic message to the client; never leak internals; never rethrow after the response is committed/streaming.
- The helper MUST NOT import `GenerateService`, the OpenAI client, or any LLM/embedding code. It is generic over `AsyncIterable<string>`.
- Tests: standalone-const harness; every `jest.fn()` captured in a const and asserted via that const (satisfy `@typescript-eslint/unbound-method`); every async function body contains an `await` (satisfy `require-await`).
- This step does NOT touch routing, controllers, modules, or DI wiring.

## Build steps
1. Create `apps/backend/src/common/sse/sse-stream.constants.ts` with all named constants from deliverable 2.
2. Create `apps/backend/src/common/sse/sse-stream.ts`:
   a. Import `type { Response } from 'express'`, `Logger` from `@nestjs/common`, and the constants (`.js`).
   b. Instantiate a module-scoped or function-scoped `Logger` (name e.g. `'writeSse'`).
   c. Implement `writeSse`: track a `closed` boolean; register the `res.on('close', ...)` handler.
   d. Set the four headers, call `res.flushHeaders()`.
   e. `try`: `for await (const token of tokens)` — if `closed`, `break`; otherwise write the JSON `data:` frame. After the loop, if not closed, write the `done` frame and `res.end()`.
   f. `catch (error: unknown)`: `logger.error(...)` with the stack; if not closed, write the safe `error` frame and `res.end()`. Do not rethrow.
   g. Add a small write-guard helper (or inline checks) so no `write`/`end` runs once `closed` / response ended.
3. Create `apps/backend/src/common/sse/sse-stream.spec.ts` covering cases (a)–(f) from deliverable 8.
4. Run `pnpm --filter backend lint`, `test`, `build`; fix until green.

## Notes for the implementer
**Out of scope (do not build):** the `POST /ask` endpoint/controller, request DTO, and retrieve→prompt→generate wiring (step 36); retrieval, prompt building, LLM generation (steps 32/33/34 ✅); the frontend consumer; auth, rate limiting, heartbeat/keep-alive pings, reconnection / `Last-Event-ID`, and any event types beyond `data` / `done` / `error`.

**Client (informational only — build nothing):** step 36's frontend consumes via `fetch` + `ReadableStream` and calls `JSON.parse` on each `data:` payload; it treats `[DONE]` as end and the `error` event as failure. This is why tokens are JSON-encoded and why a POST-friendly manual writer is used instead of `@Sse()` / `EventSource`.

**Disconnect cleanup (important):** breaking out of the `for await` loop is what triggers the source generator's `.return()`, which in step 36 aborts the in-flight OpenAI request. Do not `await` further iteration after `closed` is set. Without the break, a disconnected client would leave the LLM stream running and billing.

**Post-commit errors:** once headers are flushed and any frame is written, the HTTP response is committed — a thrown error can no longer become a normal NestJS error response. Hence: log server-side, emit a safe `error` frame if still open, end, and resolve. Re-throwing here would surface an unhandled rejection in the controller with no useful client effect.

**Idempotent end:** guard against double `res.end()` (e.g. close fires after normal completion, or error after partial output). Use the `closed` flag and/or `res.writableEnded` checks.

**Gotcha — `require-await`:** if any helper is declared `async` but contains no `await`, lint fails. `writeSse` itself is fine (`for await`). Keep synchronous write-guards non-async.

**Gotcha — call-order assertion:** to prove headers flush before the first data write (case a), capture `jest.fn()` consts and compare `mock.invocationCallOrder`, or assert `write` was not called before `flushHeaders`.

**Open questions:** none — the four resolved decisions (manual Express streaming; reusable standalone writer; JSON-encoded data frames; decoupled `AsyncIterable<string>`) are final.