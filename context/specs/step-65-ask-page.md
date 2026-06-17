# Implementation Task: /ask Page

## What to build
Replace the `AskPage` placeholder with a full chat page that owns message history, wires the `useSSE` hook to stream assistant replies, and composes the existing `ChatHistory` and `ChatInput` components into a full-height layout pinned below the navbar.

## Current state
- `apps/frontend/src/pages/AskPage.tsx` — placeholder: `const AskPage = () => <h1>Ask</h1>; export default AskPage`. This is the file to replace.
- `apps/frontend/src/hooks/useSSE.ts` — `useSSE(): { text, isStreaming, error, start(query), stop() }`. Holds only the live in-progress reply; `start()` resets `text`/`error` and aborts any in-flight stream. Does NOT own history.
- `apps/frontend/src/components/ChatHistory.tsx` — `ChatHistory({ messages: ChatHistoryMessage[] })`; `ChatHistoryMessage { id; role; content; isStreaming?; citations? }` exported from here. Auto-scrolls on `messages.length` change. Renders empty scroll container (no crash) when `messages` is `[]`.
- `apps/frontend/src/components/ChatInput.tsx` — `ChatInput({ onSubmit, disabled?, placeholder? })`; clears draft on submit; button disabled when `disabled` or empty.
- `apps/frontend/src/components/SourceCitations.tsx` — `Citation { id; text; label?; score? }` exported from here. Not rendered directly by AskPage (rendered inside `ChatHistory`); backend never sends citations yet.
- `apps/frontend/src/router.tsx` — `/ask` route: `lazy(() => import('./pages/AskPage'))`. AskPage **must** keep `export default`.
- `apps/frontend/src/components/RootLayout.tsx` — `<div class="layout"> <Navbar/> <ErrorBoundary><Suspense><Outlet/></Suspense></ErrorBoundary> </div>`. `.layout` is `min-height: 100vh; display: flex; flex-direction: column`. `<Outlet/>` is a direct flex child (via transparent React wrappers) — a page with `flex: 1` on its root fills the remaining viewport height automatically with no `calc()`.
- `apps/frontend/src/components/Navbar.module.css` — `.nav { padding: 12px 24px; ... }`. Height is not a fixed token; do not use `calc(100vh - X)`.
- `apps/frontend/src/index.css` `:root` tokens: `--color-accent`, `--color-border`, `--color-surface`, `--color-text`, `--color-text-muted`, `--color-danger`, `--color-bubble-assistant-bg`, `--font-size-sm`.
- `apps/frontend/src/components/PageWrapper.tsx` — `max-width: 1200px` centered column. Do NOT use here.

## Deliverables (definition of done)
1. `apps/frontend/src/pages/AskPage.tsx` rewritten as a `const AskPage = () => {...}` arrow function; `export default AskPage` kept for the lazy route. No other exports from this file.
2. New file `apps/frontend/src/pages/AskPage.module.css` containing all page-level styles. No inline styles.
3. The page holds `messages` state typed `ChatHistoryMessage[]`, initialised to `[]`. On initial render the page mounts without error and renders an empty `ChatHistory`.
4. Submitting a query via `ChatInput` appends two messages atomically: a `user` message with the submitted text and `isStreaming: false`, then an `assistant` message with `content: ''` and `isStreaming: true`. Both receive stable unique `id` values (via `crypto.randomUUID()`).
5. While the stream runs, the last assistant message's `content` tracks the hook's accumulated `text`, and `ChatMessage` shows the blinking cursor (`isStreaming: true` on that message).
6. On stream completion (`isStreaming` goes `true → false` with `error === null`), the last assistant message is marked `isStreaming: false`. Its `content` equals the hook's final `text`. No previous messages are touched.
7. On stream error (`error` becomes non-null), the in-progress assistant message is marked `isStreaming: false` and the error string is surfaced below `ChatInput` in an element with `role="alert"` styled with `var(--color-danger)`. The error clears on the next submission.
8. `ChatInput` receives `disabled={isStreaming}` so no new query can be submitted while a reply is in progress.
9. Layout is a full-height flex column filling the space below the navbar: `ChatHistory` expands (`flex: 1; min-height: 0`) and scrolls internally; `ChatInput` (and error region) are pinned at the bottom. No `PageWrapper`. No `calc(100vh - X)`.
10. `pnpm --filter frontend lint` passes and `pnpm --filter frontend build` succeeds. Zero `any` types.

## Rules that must hold
- `export default AskPage` is required — the router uses `React.lazy(() => import('./pages/AskPage'))`.
- CSS Modules only. Colors and font-sizes only via `var(--token)` from `index.css`. Spacing/padding may be hardcoded px (existing components set the precedent).
- Do NOT modify `useSSE`, `ChatInput`, `ChatMessage`, `ChatHistory`, `SourceCitations`, `ask.ts`, `RootLayout`, or `router.tsx`.
- Import `ChatHistoryMessage` and `Citation` from their source files; do not redefine the interfaces.
- No `any` types. No inline styles.

## Build steps
1. Create `AskPage.module.css` with `.page` (`flex: 1; display: flex; flex-direction: column; min-height: 0; overflow: hidden`) and `.inputArea` (padding, border-top with `var(--color-border)`) and `.error` (`color: var(--color-danger); font-size: var(--font-size-sm); padding: 4px 0`).
2. Rewrite `AskPage.tsx`. Import: `useSSE`, `ChatHistory` + `ChatHistoryMessage`, `ChatInput`, CSS module. Add `useRef` for tracking the current assistant message id.
3. Declare `const [messages, setMessages] = useState<ChatHistoryMessage[]>([])`. Destructure `{ text, isStreaming, error, start } = useSSE()`. Add `const currentAssistantIdRef = useRef<string | null>(null)`.
4. Implement `handleSubmit(query: string)`: generate `userId = crypto.randomUUID()` and `assistantId = crypto.randomUUID()`. Set `currentAssistantIdRef.current = assistantId`. Call `setMessages(prev => [...prev, { id: userId, role: 'user', content: query }, { id: assistantId, role: 'assistant', content: '', isStreaming: true }])`. Then call `start(query)`.
5. Sync streaming text: `useEffect(() => { const id = currentAssistantIdRef.current; if (!id) return; setMessages(prev => prev.map(m => m.id === id ? { ...m, content: text } : m)); }, [text])`. This updates only the current assistant message.
6. Finalise on done/error: `useEffect(() => { if (!isStreaming && currentAssistantIdRef.current) { const id = currentAssistantIdRef.current; currentAssistantIdRef.current = null; setMessages(prev => prev.map(m => m.id === id ? { ...m, isStreaming: false } : m)); } }, [isStreaming])`. The `!isStreaming && currentAssistantIdRef.current` guard ensures it does not fire on the initial `false` state before any stream has run.
7. JSX structure:
   ```tsx
   <div className={styles.page}>
     <ChatHistory messages={messages} />
     <div className={styles.inputArea}>
       {error && <p className={styles.error} role="alert">{error}</p>}
       <ChatInput onSubmit={handleSubmit} disabled={isStreaming} />
     </div>
   </div>
   ```
8. Run `pnpm --filter frontend lint` and fix any issues. Run `pnpm --filter frontend build` and fix any TypeScript errors.

## Notes for the implementer
- **Out of scope:** citations (always `[]` from backend — `citations` field can be omitted from messages entirely, since `ChatHistoryMessage.citations` is optional and `SourceCitations` renders `null` when empty); stop/cancel button; persisting history across navigation; markdown rendering; multi-conversation sessions.
- **Streaming sync edge case:** `useSSE.start()` resets `text` to `''` synchronously. The `useEffect` on `text` will briefly set the new assistant message's `content` to `''` — this is correct and expected. Because `currentAssistantIdRef.current` is set before `start()` is called and only cleared in the finalise effect, the sync effect will never touch completed messages.
- **`isStreaming` initial state guard:** `isStreaming` starts `false` on mount. Without the `currentAssistantIdRef.current` guard in the finalise effect, it would fire immediately on mount and attempt to map a null id (a no-op but wasteful). The guard makes intent explicit.
- **Layout:** `RootLayout` is `display: flex; flex-direction: column` and `<Outlet />` is a transparent React wrapper, so `<div className={styles.page}>` is effectively a direct flex child. Adding `flex: 1` to `.page` fills the remaining viewport below the navbar without any `calc()`.
- **Width:** Full-width (no `PageWrapper`). The `inputArea` and history content will stretch to fill the container. If a narrower reading column is desired in future, apply `max-width` and `margin-inline: auto` inside `.page` or `.inputArea` — but that is out of scope for step 65.
- **`ChatHistory` internal scroll:** `ChatHistory.module.css` already sets `height: 100%; overflow-y: auto` on `.scroll`. It needs its parent (`.page`) to be a flex column with `flex: 1; min-height: 0` — which build step 1 provides. No changes to `ChatHistory` needed.