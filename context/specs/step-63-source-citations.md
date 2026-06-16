# Implementation Task: SourceCitations Component

## What to build
A pure presentational, expandable panel component that displays a list of retrieved source chunks (citations) backing an assistant answer. It is driven entirely by props — no data fetching, no SSE, no API calls — and is rendered alongside an assistant message by `ChatHistory` (step 64) or the `/ask` page (step 65).

## Current state
- No `SourceCitations` component or any citation-related frontend code exists yet.
- `apps/frontend/src/components/ChatMessage.tsx` (step 62, merged) — presentational chat bubble, `ChatMessageProps { role: 'user' | 'assistant'; content: string; isStreaming?: boolean }`. Does NOT render citations; citations are composed outside it.
- `apps/frontend/src/components/CategoryFilter.tsx` — reference for the simple controlled-prop component pattern.
- No expand/collapse, `<details>`, or accordion pattern exists anywhere in the codebase to copy.
- `apps/frontend/src/index.css` `:root` tokens available: `--color-accent` (#6366f1), `--color-border` (#e5e7eb), `--color-surface` (#fff), `--color-text` (#374151), `--color-text-muted` (#6b7280), `--color-danger` (#ef4444), `--color-skeleton-highlight` (#f3f4f6), `--color-bubble-assistant-bg` (#f3f4f6), four badge color pairs, `--font-size-sm` (0.875rem).
- Stack: React 19 + TypeScript (strict, no `any`) + Vite, CSS Modules only.
- Backend gap (situational only): `POST /ask` SSE currently streams only text tokens + an `event: done` frame. The backend computes `RetrievedChunk[]` server-side (`apps/backend/src/retrieve/retrieve.service.ts`) but never transmits them. There is NO real data source for citations on the frontend today. See Open questions.

## Deliverables (definition of done)
1. New file `apps/frontend/src/components/SourceCitations.tsx` containing exactly one component, `const SourceCitations = (props: SourceCitationsProps) => {...}`, no default export.
2. A named, exported `interface SourceCitationsProps` defined in that file, including a `citations` array prop. Each citation item is a frontend-local type (defined from scratch in this file, NOT imported from `@ocr/types` or backend) with at minimum:
   - `id: string` — stable React key.
   - `text: string` — the snippet/source text to display.
   - `label?: string` — optional short heading (e.g. athlete + race name).
   - `score?: number` — optional relevance score.
3. Named, exported `interface` for the citation item type (e.g. `Citation`) so consumers (steps 64/65) can construct the array against a typed contract.
4. When `citations` is empty (`[]`), the component renders nothing (returns `null`) — no empty panel, no header.
5. When `citations` is non-empty, the component renders a collapsed-by-default expandable panel:
   - A summary/toggle showing a count, e.g. "Sources (3)".
   - Expanded content lists every citation: its `label` (if present), its `text`, and its `score` formatted to a fixed number of decimals (if present).
   - Each citation rendered with `key={citation.id}`.
6. Co-located `apps/frontend/src/components/SourceCitations.module.css` CSS Module. No inline styles, no Tailwind.
7. The expand/collapse is keyboard-operable and exposes correct expanded/collapsed state to assistive tech (free via native `<details>/<summary>`, or `aria-expanded` on a `<button>` if controlled state is used).
8. `pnpm --filter frontend lint` passes with the new files. No `any` types. No hardcoded color or font-size literals in the CSS Module.

## Rules that must hold
- Component convention exactly: `const SourceCitations = (props: SourceCitationsProps) => {...}`, named exported `interface SourceCitationsProps`, one component per file, co-located `.module.css`.
- Pure presentational: NO `useSSE`, NO Axios/`api/` calls, NO references to `/ask`, NO backend imports. All data arrives via props.
- Do NOT import or depend on backend `RetrievedChunk` or any backend type. Do NOT add a shared `@ocr/types` DTO for citations — no backend wire format exists yet; a premature shared type would drift.
- Do NOT modify `ChatMessage.tsx` — citations live outside it by design.
- CSS Token Rule (hard): `.module.css` may use `var(--token)` only for colors and font-sizes. Any NEW token must be added to `apps/frontend/src/index.css` `:root` FIRST, then referenced via `var()`. Non-color/non-font-size values (padding, border-radius, max-width, gap) may use literals.
- TypeScript strict; no `any` (use proper types/generics).

## Build steps
1. Create `SourceCitations.tsx`. Define and export the citation item `interface` (e.g. `Citation`) and `interface SourceCitationsProps { citations: Citation[] }` (extend with optional props only if needed).
2. Implement the empty-state guard: if `citations.length === 0`, return `null`.
3. Implement the expandable panel. Recommended default: native `<details>` with a `<summary>` showing the count label "Sources (N)". (A controlled `useState` + `<button aria-expanded>` is acceptable if a reason arises; native is preferred for free a11y.)
4. Render the citation list inside the expanded region; map over `citations` using `key={citation.id}`, showing `label` (conditional), `text`, and `score` (conditional, formatted to a fixed decimal count via a named constant — no magic number).
5. Mark any purely decorative elements (e.g. a chevron glyph) with `aria-hidden="true"`, mirroring `ChatMessage.tsx`.
6. Create `SourceCitations.module.css`. If a new color/font-size is required, add the token to `index.css` `:root` first, then reference it. Reuse existing tokens (`--color-border`, `--color-surface`, `--color-text`, `--color-text-muted`, `--font-size-sm`) where possible.
7. Run `pnpm --filter frontend lint` and fix any issues.

## Notes for the implementer
**Out of scope:**
- Wiring real citation data (extending the SSE protocol with a citations event, or a separate REST fetch) — not built and not yet planned in `PLAN.md`. This component only consumes props.
- Modifying `ChatMessage`, `ChatHistory`, the `/ask` page, or any backend code.
- Adding a shared `@ocr/types` citation DTO.

**Files likely affected:**
- `apps/frontend/src/components/SourceCitations.tsx` (new)
- `apps/frontend/src/components/SourceCitations.module.css` (new)
- `apps/frontend/src/index.css` (only if a new color/font-size token is needed)

**Edge cases:**
- Empty `citations` → render nothing (deliverable 4).
- Citation with no `label` and/or no `score` → render `text` only; do not show empty/`undefined` fields.
- Long `text` snippets — handle wrapping/overflow in CSS (literals allowed for layout).
- `score` formatting — pick a fixed decimal count via a named constant (e.g. 2 dp); do not assume a 0–1 vs 0–100 range, just format the number as given.

**Open questions (flagged gaps, non-blocking for this component):**
1. KNOWN GAP: There is no backend channel today that delivers retrieved chunks to the frontend. `SourceCitations` is shippable as a props-driven component, but it will have no live data until a future step adds a citations data channel (SSE event or REST call). This should be added to `PLAN.md` as a follow-up before step 64/65 can render real citations. Whoever wires steps 64/65 must map whatever the eventual wire format is into the frontend-local `Citation` shape.
2. Confirm desired summary label wording ("Sources (N)") and score display format with the consuming steps — these are presentational defaults the implementer may set, but they should stay consistent when steps 64/65 compose this component.