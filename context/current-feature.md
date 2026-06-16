# Current Feature: ChatInput Component

## Status
In Progress

## Goals

- Create `apps/frontend/src/components/ChatInput.tsx` — named export `ChatInput` + named `interface ChatInputProps` (`onSubmit: (query: string) => void`, `disabled?: boolean`, optional `placeholder?: string`); no default export
- Controlled text input wrapped in a `<form>` (Enter-to-submit works) with local `useState` for the draft text
- Submit handler trims the draft, blocks empty/whitespace-only submissions, calls `onSubmit(trimmed)`, and clears the input on success
- Submit button disabled when `disabled === true` OR draft is empty after trimming; input disabled/readOnly when `disabled === true`
- Create `apps/frontend/src/components/ChatInput.module.css` — colors/font-sizes only via `var(--token)`; add any missing token to `index.css` `:root` first
- `pnpm --filter frontend lint` passes; strict TypeScript, no `any`

## Notes

- Spec: `context/specs/step-61-chat-input.md` (Plan step #61)
- Purely presentational/standalone — does NOT import `useSSE`, Axios, the `api/` layer, or manage chat history
- Do NOT wire into `AskPage.tsx` or any page — that's step #65
- Out of scope: `ChatMessage` (#62), `SourceCitations` (#63), `ChatHistory` (#64), `/ask` page composition (#65)
- Existing tokens in `apps/frontend/src/index.css`: `--color-accent`, `--color-border`, `--color-surface`, `--color-text`, `--color-text-muted`, `--font-size-sm` — no spacing/radius/disabled tokens yet
- Component convention to follow: `apps/frontend/src/components/CategoryFilter.tsx` (named export, exported `Props` interface, co-located CSS module)
- Mirror backend's `@IsNotEmpty()` client-side (block whitespace-only); `maxLength={1000}` HTML attribute optional, not required
- Button label/placeholder text/`disabled` vs `readOnly` choice left to implementer discretion

## History

<!-- Completed features are tracked in context/features-history.md -->