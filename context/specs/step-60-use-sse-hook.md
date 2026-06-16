# Implementation Task: `useSSE` Hook

## What to build
A React hook (`useSSE`) plus a small API helper that POSTs a query to the backend `/ask` endpoint, consumes the `text/event-stream` response body via `fetch` + `ReadableStream`, parses SSE frames, and streams decoded tokens into React state. This is a standalone, reusable piece consumed later by the `/ask` page (step #65) — no chat UI is built here.

## Current state
- **Backend endpoint** `POST /ask` (`apps/backend/src/ask/ask.controller.ts`): accepts JSON body `{ query: string }` (`AskQueryDto`, `apps/backend/src/ask/dto/ask-query.dto.ts`, `@IsString @IsNotEmpty @MaxLength(1000)`). POST with a body → native `EventSource` is NOT usable.
- **SSE wire format** (`apps/backend/src/common/sse/sse-stream.ts`, `sse-stream.constants.ts`):
  - Response headers: `Content-Type: text/event-stream`, `Cache-Control: no-cache`, `Connection: keep-alive`, `X-Accel-Buffering: no`.
  - Token frame: `data: <JSON-string>\n\n` — note the `data:` field prefix is exactly `"data: "` (trailing space) and the payload is a JSON-encoded string, so it must be `JSON.parse`d to recover the raw token text.
  - Terminal success: `event: done\ndata: [DONE]\n\n`.
  - Terminal failure: `event: error\ndata: "Stream failed"\n\n` (payload is a JSON-encoded string).
  - Frame separator is `\n\n`; lines within a frame (`event:` then `data:`) are separated by `\n`.
  - Note: pre-stream failures (retrieval/prompt errors) return a normal JSON error response with a non-2xx status BEFORE any streaming begins — i.e. `response.ok` will be false and the body is not an event-stream.
- **Frontend stack**: React 19 + TypeScript (strict) + Vite. Axios layer in `apps/frontend/src/api/` with shared `http` instance (`apps/frontend/src/api/http.ts`) using `baseURL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'`. Existing pattern: `apps/frontend/src/api/races.ts`.
- **No `apps/frontend/src/hooks/` directory exists yet** — this is the project's first custom hook.
- `apps/frontend/src/pages/AskPage.tsx` exists as a placeholder (`<h1>Ask</h1>`) — DO NOT modify it (that is step #65).
- Axios cannot portably consume readable streams in this setup → the API helper must use plain `fetch`, but MUST resolve its base URL from `import.meta.env.VITE_API_URL ?? 'http://localhost:3000'` (same source as `http.ts`).

## Deliverables (definition of done)
1. New file `apps/frontend/src/api/ask.ts` exporting an async function (e.g. `streamAsk`) that:
   - Accepts the query string, an `AbortSignal`, and per-token / completion / error callbacks (exact signature at implementer's discretion, but typed — no `any`).
   - Issues `fetch(`${API_URL}/ask`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query }), signal })`.
   - Resolves `API_URL` from `import.meta.env.VITE_API_URL ?? 'http://localhost:3000'`.
   - Reads `response.body` via a `ReadableStreamDefaultReader` + `TextDecoder`, buffers across chunks, splits on `\n\n`, and parses each frame.
   - For a `data:`-only frame: strips the `data: ` prefix, `JSON.parse`s the payload, and emits the token via the per-token callback.
   - Detects the `event: done` / `[DONE]` frame → triggers completion and stops reading.
   - Detects the `event: error` frame → triggers the error path with the parsed message.
   - Treats `!response.ok` (pre-stream JSON error) as an error before reading the stream body.
2. New file `apps/frontend/src/hooks/useSSE.ts` exporting `useSSE` that:
   - Exposes state: accumulated streamed text (string), an `isStreaming` boolean, and an `error` value (string | null or `Error | null`).
   - Exposes a `start(query: string)` action and a `stop()`/`reset()` action (exact names at implementer's discretion; both must exist and be callable).
   - Calls `streamAsk` from the API layer — does NOT call `fetch` inline.
   - Appends each incoming token to the accumulated text via a functional state update.
   - Sets `isStreaming = true` on start, `false` on done/error/abort.
   - On error, surfaces a user-safe message and sets `isStreaming = false`.
3. A type for the hook's return value is exported and used (no implicit/`any` shapes).
4. `pnpm --filter frontend lint` passes for both new files.
5. `pnpm --filter frontend build` (tsc) passes — strict TypeScript, no `any`.

## Rules that must hold
- No `any` — use `unknown`/proper generics/typed callbacks (CLAUDE.md).
- HTTP/stream call lives in `apps/frontend/src/api/` only; the hook calls the API helper, never `fetch` directly (CLAUDE.md "HTTP calls only via a dedicated api/ layer").
- Reuse `VITE_API_URL` for the base URL; do not hardcode a different base-URL mechanism.
- Named exports preferred (the hook and helper should be named exports).
- One symbol-of-concern per file: hook in its own file, helper in its own file.
- Do NOT modify `AskPage.tsx`, build any chat UI components, or wire the page.
- Do NOT add an SSE/EventSource dependency — use built-in `fetch` + `ReadableStream` + `TextDecoder`.
- Strip the `data: ` prefix using the exact field length (note the trailing space); `JSON.parse` every payload (tokens, error message) — payloads are JSON-encoded strings, not raw text.
- Backward-compat: the backend wire format is fixed; the parser must conform to it, not the reverse.

## Build steps
1. Create `apps/frontend/src/api/ask.ts`: resolve `API_URL`, define typed callback signature, implement `fetch` POST with `signal`.
2. In the helper, guard `if (!response.ok)` → emit error (read JSON body for message if available) and return before streaming.
3. Guard `if (!response.body)` → emit error.
4. Obtain `response.body.getReader()` + `new TextDecoder()`; loop `reader.read()` accumulating into a string buffer (decode with `{ stream: true }`).
5. Split the buffer on `\n\n`; keep the trailing partial segment in the buffer; process each complete frame.
6. Per frame: detect terminal frames first (`event: done` → done + stop; `event: error` → parse `data:` payload, emit error + stop); otherwise treat as a `data:` token frame → slice off `data: `, `JSON.parse`, emit token.
7. Handle `AbortError` from `signal` gracefully (treat as a normal stop, not an error surfaced to the user).
8. Create `apps/frontend/src/hooks/useSSE.ts`: set up `useState` for text / `isStreaming` / `error`, a `useRef` for the `AbortController`, and `useCallback`-wrapped `start`/`stop`.
9. Wire `start` to create a fresh `AbortController`, reset state, call `streamAsk` with callbacks that update state; wire `stop`/`reset` to abort and reset.
10. Ensure the controller is aborted on unmount (cleanup `useEffect`) to avoid setting state after unmount.
11. Run `pnpm --filter frontend lint` and `pnpm --filter frontend build`; fix issues.

## Notes for the implementer
**Gotchas:**
- The `data:` prefix is exactly `"data: "` (6 chars, trailing space). A frame may theoretically contain multiple `data:` lines per SSE spec, but this backend emits a single `data:` line per frame — still, parse line-by-line within a frame rather than assuming a fixed character offset where convenient.
- Tokens are JSON-encoded, so a token can legitimately contain whitespace/newlines/quotes once parsed — always `JSON.parse`, never use the raw substring as the token.
- Network chunks do NOT align to frame boundaries — you MUST buffer and only process frames terminated by `\n\n`, retaining any partial trailing frame.
- A token's own text could contain `\n` after parsing, but the raw JSON-encoded wire payload will not contain a literal newline, so splitting the raw buffer on `\n\n` is safe.
- Avoid React state updates after unmount/abort (use the ref'd controller + cleanup).

**Edge cases to handle:** empty/whitespace-only query (decide: block client-side or let backend 400 surface as error — recommend surfacing backend error), pre-stream non-2xx JSON error, mid-stream `event: error` frame, user abort, stream ending without a `done` frame (connection dropped → surface as error or silent stop — recommend treating an unexpected end as a non-error stop, finalizing `isStreaming = false`).

**Out of scope:** `ChatInput`/`ChatMessage`/`SourceCitations`/`ChatHistory` components, `/ask` page wiring, any modification to `AskPage.tsx`, retry/reconnect logic, source-citation parsing (backend streams plain tokens only).

**Open questions (non-blocking — flagged for implementer/reviewer):**
1. Should the hook expose the parsed error as `string` or `Error`? Spec allows either; pick one and keep it consistent in the exported return type.
2. Should `start` auto-reset prior accumulated text, or append across calls? Recommend reset-on-start for a single-question hook; the page can manage history later (step #64).