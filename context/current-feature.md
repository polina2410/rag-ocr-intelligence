# Current Feature: useSSE Hook

## Status
In Progress

## Goals

- Create `apps/frontend/src/api/ask.ts` exporting `streamAsk`: POSTs `{ query }` to `/ask`, reads the response body as a stream, parses SSE frames (`data:`, `event: done`, `event: error`), and emits tokens/completion/error via typed callbacks
- Create `apps/frontend/src/hooks/useSSE.ts` exporting `useSSE`: exposes accumulated streamed text, `isStreaming`, `error`, and `start`/`stop` actions; calls `streamAsk` (never `fetch` inline)
- Export a typed return shape for `useSSE` (no `any`)
- `pnpm --filter frontend lint` passes
- `pnpm --filter frontend build` passes

## Notes

- Spec: `context/specs/step-60-use-sse-hook.md` (Plan step #60)
- Backend `POST /ask` (`apps/backend/src/ask/ask.controller.ts`) takes `{ query: string }`, max length 1000. It's a POST so native `EventSource` cannot be used — must manually parse SSE via `fetch` + `ReadableStream` + `TextDecoder`.
- Wire format (`apps/backend/src/common/sse/sse-stream.ts` / `.constants.ts`): frames separated by `\n\n`; token frames are `data: "<JSON-encoded token>"`; terminal success is `event: done` / `data: [DONE]`; terminal failure is `event: error` / `data: "Stream failed"` (JSON-encoded string). `data:` prefix is exactly `"data: "` (trailing space).
- Pre-stream errors return non-2xx JSON before any streaming begins — check `!response.ok` first.
- Resolve API base URL from `import.meta.env.VITE_API_URL ?? 'http://localhost:3000'` (same as `apps/frontend/src/api/http.ts`), but use plain `fetch`, not the Axios `http` instance (Axios doesn't portably support stream consumption here).
- No `apps/frontend/src/hooks/` directory exists yet — this is the first one.
- Do NOT modify `apps/frontend/src/pages/AskPage.tsx` (still a placeholder) — wiring it is step #65, out of scope here.
- No chat UI components (`ChatInput`, `ChatMessage`, etc.) — those are steps #61-64, out of scope.
- Handle: AbortError on signal abort (treat as normal stop, not error), unmount cleanup (abort + no state updates after unmount), stream ending without `done` frame (treat as non-error stop).

## History

<!-- Completed features are tracked in context/features-history.md -->