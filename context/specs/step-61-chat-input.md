# Implementation Task: ChatInput Component

## What to build
A standalone, controlled React component that captures a user's text query and fires an `onSubmit(query)` callback with the trimmed string. It is purely presentational: it does not call `useSSE`, manage chat history, or get wired into a page (that is step #65). Scope is a text input plus a submit button.

## Current state
- No chat-related components exist yet — this is the first of Phase 4's chat UI (steps 61-65). Both `apps/frontend/src/components/ChatInput.tsx` and `ChatInput.module.css` are NEW files.
- `apps/frontend/src/hooks/useSSE.ts` exists (step #60, merged): `useSSE()` returns `{ text, isStreaming, error, start, stop }`; `start(query: string)` begins a stream, `isStreaming` is true while streaming. Step #65 will pass `isStreaming` into this component and call `start(query)` from `onSubmit`. ChatInput does NOT import or use this hook.
- Backend `apps/backend/src/ask/dto/ask-query.dto.ts` enforces `@IsNotEmpty()` and `@MaxLength(1000)` on the query.
- Component convention (`apps/frontend/src/components/CategoryFilter.tsx`, `RaceCard.tsx`, `Badge.tsx`): named `const ComponentName = (props: ComponentNameProps) => {...}`, exported `interface ComponentNameProps`, co-located `ComponentName.module.css`, no default export, one component per file.
- Design tokens live in `apps/frontend/src/index.css` `:root`. Available and relevant: `--color-accent` (#6366f1), `--color-border` (#e5e7eb), `--color-surface` (#fff), `--color-text` (#374151), `--color-text-muted` (#6b7280), `--font-size-sm` (0.875rem). No spacing/radius/disabled-color tokens exist yet.
- Stack: React 19 + TypeScript (strict, no `any`) + Vite. CSS Modules only — no inline styles, no Tailwind.

## Deliverables (definition of done)
1. NEW file `apps/frontend/src/components/ChatInput.tsx` exporting a named const `ChatInput` and a named `interface ChatInputProps`. No default export.
2. `ChatInputProps` exposes at minimum:
   - `onSubmit: (query: string) => void` — called with the trimmed query on submit.
   - `disabled?: boolean` — when true, input and button are non-interactive (step #65 passes `isStreaming`).
   - (optional, implementer's discretion) `placeholder?: string` with a sensible default.
3. Component renders a single-line text input (or `<input type="text">`) and a submit button, wrapped in a `<form>` so Enter-to-submit works.
4. Input is controlled via local `useState` holding the current draft text; ChatInput owns this state (it is the input's text, not the chat history).
5. Submit handler (form `onSubmit`) prevents default, trims the draft, and:
   - Does nothing if the trimmed value is empty/whitespace-only (no callback fired).
   - Otherwise calls `onSubmit(trimmedValue)` and clears the local input state to `''`.
6. The submit button is disabled when `disabled === true` OR when the trimmed draft is empty.
7. The input is disabled (or `readOnly`) when `disabled === true`.
8. NEW file `apps/frontend/src/components/ChatInput.module.css` styling the form, input, and button using only `var(--token)` references for all colors and font-sizes — no color/font-size literals.
9. Any new color/font-size token required (e.g. a disabled/muted button background) is FIRST added to `:root` in `apps/frontend/src/index.css`, then referenced via `var()`. (Non-color/font-size values like spacing, border-radius, widths may use literals.)
10. `pnpm --filter frontend lint` passes; no TypeScript errors; no `any`.

## Rules that must hold
- No default export; named export only (matches `CategoryFilter.tsx`).
- No inline styles, no Tailwind — CSS Modules only.
- CSS Token Rule: no hardcoded color or font-size literals in `.module.css`; add to `index.css` first if no token fits.
- Strict TypeScript, no `any` — type event handlers (e.g. `React.ChangeEvent<HTMLInputElement>`, `React.FormEvent<HTMLFormElement>`).
- Component must remain fully controlled/standalone — it must NOT import `useSSE`, Axios, the `api/` layer, or any chat-history state.
- Do not wire this into `AskPage.tsx` or any page — that is step #65.
- Client-side empty-guard must mirror backend `@IsNotEmpty()` so whitespace-only submissions never round-trip.

## Build steps
1. Create `apps/frontend/src/components/ChatInput.module.css` with classes for the form wrapper, input, and button. Confirm needed tokens exist in `index.css`; if a disabled-state color is wanted and absent, add it to `:root` first.
2. Create `apps/frontend/src/components/ChatInput.tsx`: define and export `ChatInputProps`, import the CSS module.
3. Add local `useState<string>('')` for the draft.
4. Implement the form `onSubmit`: `preventDefault`, compute `trimmed = value.trim()`, return early if empty, else call `onSubmit(trimmed)` and reset state to `''`.
5. Wire input `value`/`onChange` to local state; wire `disabled` prop to input and button; disable button additionally when trimmed draft is empty.
6. Run `pnpm --filter frontend lint` and resolve any issues.

## Notes for the implementer
**Out of scope:** rendering messages or streaming tokens (#62 ChatMessage), citations (#63), the scrollable list (#64), composing/wiring into the page and `useSSE` (#65), multiline/textarea auto-grow, send-on-Shift+Enter semantics, loading spinners inside the button.
**Files likely affected:** `apps/frontend/src/components/ChatInput.tsx` (new), `apps/frontend/src/components/ChatInput.module.css` (new), `apps/frontend/src/index.css` (only if a new token is needed).
**Edge cases to handle:** whitespace-only input (blocked), submit while `disabled` (blocked), Enter key submission (works via `<form>`), input cleared after a successful submit.
**Edge cases deferred:** enforcing the 1000-char max as a hard error. A `maxLength={1000}` HTML attribute on the input is an acceptable lightweight mirror but is optional, not required.
**Open questions (non-blocking):** none. The exact button label, placeholder text, and whether to use `disabled` vs `readOnly` on the input are left to implementer discretion.