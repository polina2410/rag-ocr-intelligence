# Implementation Task: ChatMessage component

## What to build
A presentational React component that renders a single chat message bubble for either a `user` or `assistant` message, given its role and text content. It supports an optional in-progress (streaming) visual state for assistant messages whose text is still arriving token-by-token. It does NOT fetch, accumulate, or manage chat history.

## Current state
- `apps/frontend/src/components/ChatInput.tsx` (step 61, merged) — presentational input; captures a draft and calls `onSubmit(query)`. Does not manage messages or history. Mirror its file structure/conventions.
- `apps/frontend/src/components/CategoryFilter.tsx` — canonical example of the codebase's simple presentational component pattern (named exported `interface`, named `const` arrow component, co-located CSS Module, no fetching).
- `apps/frontend/src/hooks/useSSE.ts` (step 60, merged) — `useSSE(): { text, isStreaming, error, start, stop }`. Holds ONE live response at a time; `text` is the in-progress assistant message accumulated token-by-token; `isStreaming` true while a stream is in flight. History of past message pairs is NOT managed here — it belongs to step 64 (`ChatHistory`) / step 65 (`/ask` page).
- `apps/frontend/src/index.css` `:root` — existing tokens: `--color-accent` (#6366f1), `--color-border`, `--color-surface` (#fff), `--color-text` (#374151), `--color-text-muted` (#6b7280), `--color-danger`, `--color-skeleton-highlight`, four badge bg/text pairs, `--font-size-sm` (0.875rem). No user/assistant bubble-background tokens exist yet.
- No `ChatMessage` component exists yet.
- `SourceCitations` (step 63) does not exist yet and is OUT of scope here.
- Stack: React 19 + TypeScript (strict, no `any`) + Vite, CSS Modules only.

## Deliverables (definition of done)
1. New file `apps/frontend/src/components/ChatMessage.tsx` exporting a named `const ChatMessage` arrow component and a named exported `interface ChatMessageProps`. No default export.
2. `ChatMessageProps` exposes at minimum:
   - `role: 'user' | 'assistant'` — required.
   - `content: string` — required; the (possibly partial) text to render.
   - `isStreaming?: boolean` — optional, defaults to `false`; when `true`, renders the in-progress indicator (see deliverable 5).
3. The component renders `content` as visible text inside a bubble element. Multi-line content (newlines in the string) renders as visible line breaks (e.g. via CSS `white-space: pre-wrap` on the bubble), not collapsed onto one line.
4. The rendered bubble's CSS class / alignment differs by `role`: a user message and an assistant message are visually distinguishable (e.g. different background and/or horizontal alignment). This must be driven by `role`, verifiable by inspecting the applied class names.
5. When `isStreaming === true`, a visible in-progress indicator is rendered (e.g. a blinking caret / typing dot appended after the content). When `isStreaming` is falsy, the indicator is absent. This is verifiable by toggling the prop.
6. When `isStreaming === true` and `content` is an empty string, the component still renders the bubble with the in-progress indicator (no crash, no empty/invisible render — the bubble must show the indicator). Verifiable.
7. New file `apps/frontend/src/components/ChatMessage.module.css` containing all styles. No inline styles anywhere in the `.tsx`.
8. If distinct user/assistant bubble background colors are used, the required `--color-*` token(s) are added to `apps/frontend/src/index.css` `:root` FIRST and referenced via `var(--token)` in the CSS Module (see Rules).
9. `pnpm --filter frontend lint` passes with no new errors/warnings for the new files.
10. `pnpm --filter frontend build` (TypeScript) succeeds with the new component in place (component may be temporarily referenced from a throwaway usage or left unimported — build must still type-check the file; if the build does not type-check unimported files, this is satisfied by deliverable 9 + lint).

## Rules that must hold
- Component convention exactly: `export interface ChatMessageProps { ... }` and `export const ChatMessage = (props: ChatMessageProps) => { ... }`. No default export. One component per file.
- No `any`. Use the literal union `'user' | 'assistant'` for `role` (do not use a bare `string`).
- Styling via the co-located CSS Module only. No inline styles, no Tailwind.
- CSS Token Rule (hard): in `ChatMessage.module.css`, all color and font-size values MUST be `var(--token)`. Any new color token needed (e.g. distinct bubble backgrounds) must be added to `apps/frontend/src/index.css` `:root` BEFORE being referenced. Non-color/font-size values (padding, border-radius, max-width, gap, margin) MAY use literals.
- Presentational only: no `useSSE`, no Axios, no TanStack Query, no data fetching, no global state. The component receives everything via props.
- Backward-compat: do not modify `ChatInput.tsx`, `useSSE.ts`, or existing tokens' values. Adding new tokens to `:root` is allowed; changing existing ones is not.
- Do NOT render citations/sources or any step-63 concern inside `ChatMessage`.

## Build steps
1. If distinct bubble backgrounds are desired, add the new color token(s) to `apps/frontend/src/index.css` `:root` (e.g. a user-bubble background and an assistant-bubble background pair). Choose values consistent with the existing palette.
2. Create `apps/frontend/src/components/ChatMessage.module.css` with: a base bubble class, role-specific modifier classes (user vs. assistant) for background/alignment, `white-space: pre-wrap` for multi-line content, and a style for the streaming indicator. All colors/font-sizes via `var()`.
3. Create `apps/frontend/src/components/ChatMessage.tsx`: define `ChatMessageProps`, implement `ChatMessage` selecting the role modifier class, rendering `content`, and conditionally rendering the in-progress indicator when `isStreaming`.
4. Mirror `CategoryFilter.tsx` / `ChatInput.tsx` for import style and structure.
5. Run `pnpm --filter frontend lint` and `pnpm --filter frontend build`; fix any issues in the new files.

## Notes for the implementer
**Out of scope:**
- Chat history / list of messages (step 64 `ChatHistory`).
- Wiring to `useSSE`, the `/ask` page, or any data source (step 65).
- Source citations / retrieved chunks (step 63) — `ChatMessage` must not depend on or render these.
- Markdown rendering, syntax highlighting, copy-to-clipboard, avatars, timestamps — none are required unless later specced.

**Edge cases to handle:**
- `content === ''` with `isStreaming === true`: render bubble + indicator only (see deliverable 6).
- Multi-line `content`: preserve line breaks.
- Long unbroken content: bubble should not overflow its container horizontally (apply a reasonable `max-width` and word-wrapping); use literals for these non-color values.

**Files likely affected:** `apps/frontend/src/components/ChatMessage.tsx` (new), `apps/frontend/src/components/ChatMessage.module.css` (new), `apps/frontend/src/index.css` (new token(s), if bubble backgrounds differ).

**Open questions (non-blocking for this component):**
1. Where the streaming flag originates at compose time: the live assistant message's `isStreaming` will be fed from `useSSE().isStreaming` by step 64/65. `ChatMessage` only needs the boolean prop; the caller owns the wiring. No action needed here.
2. Whether `SourceCitations` (step 63) will be composed alongside/inside a message at the `ChatHistory`/`/ask` level rather than inside `ChatMessage`. This spec assumes citations live OUTSIDE `ChatMessage`; if a later decision requires `ChatMessage` to host a citations slot, that is a follow-up change, not part of this deliverable.
3. Error-state rendering (when `useSSE().error` is set) is assumed to be handled by the composing component, not `ChatMessage`. If a dedicated error message bubble is wanted, raise as a follow-up — not included here.