# Implementation Task: useCursor hook

## What to build
A thin custom hook `useCursor` that wraps `useContext(CursorContext)` and returns the full `CursorContextValue` (`{ x, y, hint, mode }`). It exists so downstream consumers (steps 72 `CursorDot`, 73 `data-cursor-hint` tooltip) import a single hook instead of pairing `useContext` with `CursorContext`. No transformation of the value.

## Current state
- `apps/frontend/src/context/CursorContext.tsx` (step 70 ✅) — exports `CursorContext`, `CursorProvider`, `CursorMode`, `CursorContextValue { x: number; y: number; hint: string | null; mode: CursorMode }`. Context created with a concrete `DEFAULT_VALUE` (not `undefined`).
- `apps/frontend/src/hooks/useSSE.ts` — reference for conventions: named `export const`, arrow function, explicit return type, no `any`.
- `apps/frontend/src/hooks/` — directory exists; only `useSSE.ts` inside.
- Stack: React 19, TypeScript strict, Vite. Hook files use `.ts` (no JSX).

## Deliverables (definition of done)
1. New file `apps/frontend/src/hooks/useCursor.ts`.
2. Single named export `const useCursor`, arrow function, explicit return type `: CursorContextValue`. No default export.
3. `useCursor` calls `useContext(CursorContext)` and returns the value unchanged — no spread, no remap, same object reference.
4. `CursorContext` imported as a value; `CursorContextValue` imported via `import type` — both from `../context/CursorContext`.
5. File does NOT re-export `CursorContext`, `CursorProvider`, `CursorMode`, or `CursorContextValue`.
6. `pnpm --filter frontend lint` passes with no new errors.
7. `pnpm --filter frontend build` compiles with no `any` and no unused imports.

## Rules that must hold
- Named export only; no default export.
- No `any`; explicit return type annotation `: CursorContextValue`.
- File extension `.ts` (no JSX).
- One hook per file — no other exports.
- Do NOT modify `CursorContext.tsx`.
- Pure wrapper: no derived state, no memoization, no side effects.

## Build steps
1. Create `apps/frontend/src/hooks/useCursor.ts`.
2. Import `useContext` from `react`; import `CursorContext` (value) and `type CursorContextValue` from `../context/CursorContext`.
3. Export `export const useCursor = (): CursorContextValue => useContext(CursorContext)`.
4. Run `pnpm --filter frontend lint` and `build` — fix any errors.

## Notes for the implementer
**Out of scope:** `CursorDot` (step 72), tooltip system (step 73), performance work, changes to `CursorContext.tsx`.

**Files affected:** only the new `apps/frontend/src/hooks/useCursor.ts`.

**On the "throw outside provider" pattern:** `CursorContext` was created with a concrete `DEFAULT_VALUE` (not `undefined`), so `useContext` can never return `undefined` — a standard `undefined` guard cannot fire and would be dead code. Skip the guard and ship the plain wrapper. If a hard out-of-provider error is needed in future it requires changing step 70's context default, which is out of scope here.

**Re-render behaviour:** `useCursor` re-renders its consumer on every `mousemove` because `CursorProvider` sets state on every move. This is the provider's design; do not add throttling or `useMemo` here.
