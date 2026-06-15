# Implementation Task: Badge Component

## What to build
A reusable `Badge` component that renders a small pill-shaped label with a color determined by a `variant` key. It is a presentational primitive used to show race types (`Sprint`, `Super`, `DEKA`, `Open`) and free-form athlete categories. Unknown variant values fall back to a neutral default style.

## Current state
- No `Badge` component exists yet. New files: `apps/frontend/src/components/Badge.tsx` and `apps/frontend/src/components/Badge.module.css`.
- `apps/frontend/src/index.css` — `:root` defines only `--color-accent: #6366f1` and `--color-border: #e5e7eb`. No semantic color tokens. Do not add tokens here.
- Component convention (confirmed in `Navbar.tsx`, `PageWrapper.tsx`): named `const` arrow function, named export, props typed inline, `import styles from './X.module.css'`, one component per file, no inline styles.
- Shared types: `RaceDto.raceType: 'Sprint' | 'Super' | 'DEKA' | 'Open'`; `AthleteDto.category: string` (free-form, e.g. "Elite", "Masters", "Open").
- First consumers: step 51 (`RaceCard`, likely `raceType`) and step 58 (`AthleteLeaderboard`, likely `category`). Not yet built — `Badge` ships standalone this step.
- React 19.2.6, TypeScript ~6.0.2, Vite 8. CSS Modules only, no Tailwind.

## Deliverables (definition of done)
1. `apps/frontend/src/components/Badge.tsx` exists, exporting a named `const` arrow component `Badge`.
2. Component accepts exactly two props: `label: string` and `variant: string`, typed via an exported `BadgeProps` interface.
3. Component renders a single `<span>` with `className={styles.badge}`, `data-variant={variant}`, and `{label}` as text content.
4. `apps/frontend/src/components/Badge.module.css` exists with: a base `.badge` rule (pill shape, padding, font-size, border-radius, inline-block) that provides the neutral/default appearance, and per-variant overrides via `.badge[data-variant="Sprint"]`, `[data-variant="Super"]`, `[data-variant="DEKA"]`, `[data-variant="Open"]`.
5. Unknown or free-form `variant` values (e.g. "Masters", "Elite", "") render the neutral base style with no additional code.
6. Each named variant has a visually distinct background color from the accent family (indigo / violet / sky / emerald / amber etc.) with hex values hardcoded in the CSS file; text color provides sufficient contrast.
7. No edits to `index.css`; no new `:root` tokens; no inline styles.
8. `pnpm --filter frontend lint` passes.

## Rules that must hold
- Color variants resolved via `data-variant` attribute selectors — NOT one CSS Module class per variant. Rationale: `category` is free-form; the attribute approach degrades gracefully for any unknown string with zero extra code.
- `variant` is typed as `string` (not a union) because athlete categories are open-ended.
- Named export only (`export const Badge`, `export interface BadgeProps`).
- Purely presentational: no icon, no close button, no click handler, no `children` — text from `label` only.
- No `any` types.

## Build steps
1. Create `Badge.module.css`: define `.badge` base rule (display inline-block, small `font-size`, tight `padding`, high `border-radius` for pill shape, neutral background + text color, `white-space: nowrap`).
2. Add attribute-selector overrides in the same file for the four known `raceType` values, each with a distinct background (and foreground if contrast requires it).
3. Create `Badge.tsx`: export `BadgeProps`, implement `const Badge = ({ label, variant }: BadgeProps) => <span className={styles.badge} data-variant={variant}>{label}</span>`, export `Badge`.
4. Run `pnpm --filter frontend lint`; fix any issues.

## Notes for the implementer
**Out of scope:** size prop, icons, dismiss button, click/interaction, dark-mode, integration into `RaceCard` or `AthleteLeaderboard` (steps 51 and 58).

**Files affected:** `Badge.tsx` (new), `Badge.module.css` (new). No existing files modified.

**Accessibility:** visible text content is sufficient for a label badge; no `role` or `aria-*` needed at this step. Aim for WCAG AA contrast on each variant's background/text pair.

**Open questions (non-blocking):**
- Q1: Variant color palette is implementer's choice from the accent family — adjust if a design source prescribes specific colors.
- Q2: `data-variant` matching is case-sensitive by default, which aligns with the `raceType` union casing (`'Sprint'`, not `'sprint'`).