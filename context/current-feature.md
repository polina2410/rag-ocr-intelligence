# Current Feature: ErrorBoundary Component

## Status
In Progress

## Goals
- `components/ErrorBoundary.tsx` — named `ErrorBoundary` class component, `Component<ErrorBoundaryProps, ErrorBoundaryState>`
- Props: `children: ReactNode` + optional `fallback: (error: Error, reset: () => void) => ReactNode`
- State: `{ hasError: boolean; error: Error | null }` initialised to no-error
- `static getDerivedStateFromError(error: unknown)` sets error state
- `componentDidCatch(error: unknown, info: ErrorInfo)` logs via `console.error`; types narrowed, no `any`
- `reset` method reverts state so subtree re-mounts
- `render()`: no error → children; error + fallback prop → `fallback(error, reset)`; error + no fallback → default UI with "Try again" button
- `components/ErrorBoundary.module.css` — styles for default fallback UI using `var(--color-accent)` / `var(--color-border)`, no inline styles
- `pnpm --filter frontend lint` passes
- `pnpm --filter frontend build` passes
- No existing files modified

## Notes
- Must be a class component — only supported React mechanism for error boundaries
- Caught values typed as `unknown`; narrow with `instanceof Error` before reading `.message`
- Do NOT wire into App.tsx, router.tsx, or add errorElement — that's step 44
- Do NOT install any packages
- Spec: `context/specs/step-43-error-boundary.md`

## History

<!-- Completed features are tracked in context/features-history.md -->