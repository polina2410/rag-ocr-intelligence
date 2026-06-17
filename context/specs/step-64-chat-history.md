# Implementation Task: ChatHistory component

## What to build
A purely presentational `ChatHistory` component that renders a given array of chat messages as a scrollable list, composing one `ChatMessage` per item plus an optional `SourceCitations` panel when a message carries citations. It owns no fetching and no self-mutating state; the message array arrives entirely via props.

## Current state
- `apps/frontend/src/components/ChatMessage.tsx` (merged) — `export interface ChatMessageProps { role: 'user' | 'assistant'; content: string; isStreaming?: boolean }`; named export `ChatMessage`, no default export. Renders one bubble aligned/colored by `role`, blinking cursor when `isStreaming`.
- `apps/frontend/src/components/SourceCitations.tsx` (merged) — `export interface Citation { id: string; text: string; label?: string; score?: number }`, `export interface SourceCitationsProps { citations: Citation[] }`; named export `SourceCitations`. Returns `null` when `citations` is empty, else a collapsed `<details>` panel. Meant to render ALONGSIDE a `ChatMessage`, not inside it.
- `apps/frontend/src/hooks/useSSE.ts` (merged) — holds exactly ONE live response at a time; does NOT store history. History ownership belongs to whoever renders >1 message. `ChatHistory` is that owner of the rendered list, but does NOT call `useSSE` (wiring is step 65, the `/ask` page).
- `apps/frontend/src/index.css` `:root` tokens available: `--color-accent`, `--color-border`, `--color-surface`, `--color-text`, `--color-text-muted`, `--color-danger`, `--color-skeleton-highlight`, `--color-bubble-assistant-bg`, four badge-variant pairs, `--font-size-sm`.
- Stack: React 19, TypeScript (strict, no `any`), Vite, CSS Modules only. No scrollable-list / auto-scroll pattern exists anywhere yet to copy from.
- KNOWN GAP (do not re-litigate): the backend `/ask` SSE stream sends text tokens only, never citations. `SourceCitations` has no real data source yet. `ChatHistory` must accept citations as optional per-message data and must NOT fetch or fabricate them.

## Deliverables (definition of done)
1. New file `apps/frontend/src/components/ChatHistory.tsx` exporting a named `const ChatHistory` (arrow function, no default export).
2. An exported `interface ChatHistoryMessage` defined in that file with the shape: `{ id: string; role: 'user' | 'assistant'; content: string; isStreaming?: boolean; citations?: Citation[] }`. `Citation` is imported from `./SourceCitations`.
3. An exported `interface ChatHistoryProps` with at minimum `{ messages: ChatHistoryMessage[] }`.
4. New file `apps/frontend/src/components/ChatHistory.module.css` containing the scroll-container and list styles, using only `var(--token)` for any color and font-size values.
5. The component renders a scrollable container (`overflow-y: auto`) wrapping the message list.
6. For each `messages[i]`, the component renders exactly one `<ChatMessage role content isStreaming />` using `key={message.id}`.
7. For each message where `citations` is present and non-empty, a `<SourceCitations citations={message.citations} />` is rendered alongside (after) that message's `ChatMessage`. Messages with absent/empty `citations` render no citations panel (rely on `SourceCitations` returning `null`).
8. When `messages` is empty, the component renders the empty scroll container (no message rows, no crash) — no placeholder text required unless trivially added.
9. Any new color/font-size tokens introduced are added to `apps/frontend/src/index.css` `:root` FIRST, then referenced via `var()`. (None expected to be needed.)
10. `pnpm --filter frontend lint` passes and the project type-checks with no `any`.

## Rules that must hold
- Component convention (exact): named `const ChatHistory = (props: ChatHistoryProps) => {...}`, no default export; exported `interface ChatHistoryProps`; one component per file; co-located `ChatHistory.module.css`.
- No inline styles, no Tailwind. CSS Modules only.
- CSS Token Rule: `.module.css` colors and font-sizes via `var(--token)` only — no hardcoded literals. New tokens go into `index.css` `:root` first.
- No `any`; strict TypeScript.
- `ChatHistory` MUST NOT call `useSSE`, fetch data, or own a self-mutating `useState` for the message array. It renders `props.messages` only.
- Do NOT modify `ChatMessage.tsx` or `SourceCitations.tsx`. Reuse them as-is. `Citation` is imported from the sibling `./SourceCitations` (allowed; not a backend/shared-types import).
- Do not fabricate or fetch citation data.

## Build steps
1. Create `ChatHistory.tsx`. Import `styles` from `./ChatHistory.module.css`, `ChatMessage` from `./ChatMessage`, and `SourceCitations` + the `Citation` type from `./SourceCitations`.
2. Define and export `interface ChatHistoryMessage` (deliverable #2) and `interface ChatHistoryProps` (deliverable #3).
3. Implement `ChatHistory` to map over `messages`, rendering per item a wrapper element keyed by `message.id` containing the `ChatMessage` and, after it, a `SourceCitations` fed `message.citations ?? []` (or conditionally rendered when present).
4. Wrap the mapped output in a scrollable container `<div className={styles.scroll}>`.
5. Create `ChatHistory.module.css` with `.scroll` (e.g. `overflow-y: auto`, a height/flex strategy, vertical gap between messages) using only token-based colors/font-sizes.
6. (Optional nice-to-have, scope tightly) Auto-scroll to bottom on new messages via a `ref` on a bottom sentinel + `useEffect` calling `scrollIntoView`, keyed on `messages.length`. Do NOT introduce virtualization or infinite scroll.
7. Run `pnpm --filter frontend lint` and confirm type-check passes.

## Notes for the implementer
**Out of scope:** wiring `useSSE`, owning/mutating the message array, the `/ask` page (step 65), real citation data from the backend, virtualized/infinite-scroll lists, message persistence.
**Files likely affected:** new `ChatHistory.tsx`, new `ChatHistory.module.css`; `index.css` only if a new token is genuinely needed (unlikely).
**Edge cases:** empty `messages` array (render empty container, no crash); a message with `isStreaming: true` (pass through to `ChatMessage` unchanged); a message with `citations: []` or undefined (no panel — `SourceCitations` already returns `null` for empty, so passing `message.citations ?? []` is safe).
**Gotchas:** `SourceCitations` must render alongside (sibling of), not nested inside, `ChatMessage` — `ChatMessage` accepts no children. Use a per-message wrapper element to group the bubble and its citations under one `key`.
**Open questions (non-blocking):** none. If auto-scroll behavior on streaming updates (every token) feels excessive, key the scroll effect on `messages.length` rather than message content so it fires on new messages only, not on every token append — implementer's discretion.