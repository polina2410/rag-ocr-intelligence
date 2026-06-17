# Current Feature: useCursor Hook

## Status
In Progress

## Goals

- NEW `apps/frontend/src/hooks/useCursor.ts` — single named export `const useCursor = (): CursorContextValue => useContext(CursorContext)`
- Returns full `CursorContextValue` unchanged — no spread, no remap, same object reference
- `CursorContext` imported as value; `CursorContextValue` imported via `import type` — both from `../context/CursorContext`
- File exports nothing else — no re-exports of `CursorContext`, `CursorProvider`, `CursorMode`, or `CursorContextValue`
- `pnpm --filter frontend lint` passes; build compiles with no `any` and no unused imports

## Notes

- File extension `.ts` not `.tsx` (no JSX)
- No "throw outside provider" guard — context has a concrete `DEFAULT_VALUE`, so `useContext` never returns `undefined`; a guard would be dead code
- Do NOT modify `CursorContext.tsx`
- Re-render behaviour (on every `mousemove`) is the provider's design — no throttle or `useMemo` here
- Spec: `context/specs/step-71-use-cursor-hook.md`

## History

<!-- Completed features are tracked in context/features-history.md -->
