# Implementation Task: Font-Size Globals and Fluid Typography

## What to build
Replace the five fixed-`rem` font-size CSS custom properties in `apps/frontend/src/index.css` with a seven-token fluid type scale built on `clamp()`, adding two new tokens (`--font-size-lg`, `--font-size-2xl`) and three token groups (`--line-height-*`, `--font-weight-*`). Set a baseline `line-height` on `body`, migrate the one hardcoded font-size that bypasses the token system, and repoint `RaceHeader .name` from `--font-size-xl` to `--font-size-2xl` to preserve its current 2rem desktop size. No new components or behavior.

## Current state
- `apps/frontend/src/index.css` — `:root` defines exactly 5 font-size tokens, all fixed `rem`:
  `--font-size-hero: 4rem`, `--font-size-xl: 2rem`, `--font-size-base: 1rem`, `--font-size-sm: 0.875rem`, `--font-size-xs: 0.75rem`. `body` has `margin: 0; font-family: system-ui, sans-serif; cursor: none;` — no `line-height`. No `--line-height-*` or `--font-weight-*` tokens.
- `apps/frontend/src/components/EmptyState.module.css:11` — `.icon { font-size: 2rem; line-height: 1; }` — only hardcoded font-size literal in a component file.
- `apps/frontend/src/components/RaceHeader.module.css:9` — only consumer of `--font-size-xl`.
- `--font-size-hero` consumed by `RacesHero.module.css`.
- `--font-size-base`, `--font-size-sm`, `--font-size-xs` consumed across ~20 CSS modules — names must not change.
- `--font-size-lg` and `--font-size-2xl` are currently undefined (zero consumers).

## Deliverables (definition of done)
1. `:root` defines all 7 font-size tokens as `clamp()` expressions per Build step 1. Token names `--font-size-xs`, `--font-size-sm`, `--font-size-base`, `--font-size-xl`, `--font-size-hero` are unchanged.
2. At viewport ≥ 1280px every pre-existing token resolves to its old fixed value, **except `--font-size-xl`** which now caps at `1.5rem` (down from `2rem`) — acceptable because its only consumer is repointed in deliverable 5.
3. `:root` defines `--line-height-tight: 1.2`, `--line-height-snug: 1.4`, `--line-height-base: 1.5`.
4. `:root` defines `--font-weight-regular: 400`, `--font-weight-medium: 500`, `--font-weight-semibold: 600`, `--font-weight-bold: 700`.
5. `body` rule in `index.css` includes `line-height: var(--line-height-base)`.
6. `EmptyState.module.css` `.icon` uses `font-size: var(--font-size-2xl)` (not the literal `2rem`); `line-height: 1` is preserved.
7. `RaceHeader.module.css` `.name` uses `font-size: var(--font-size-2xl)` (was `--font-size-xl`). Desktop size is preserved: `--font-size-2xl` max is `2rem`, same as the old `--font-size-xl` fixed value.
8. `pnpm --filter frontend lint` passes with no new errors.
9. `pnpm --filter frontend build` succeeds.

## Rules that must hold
- Do NOT rename or remove `--font-size-hero`, `--font-size-xl`, `--font-size-base`, `--font-size-sm`, `--font-size-xs` — existing consumers depend on these exact names.
- Use the exact `clamp()` values given in Build step 1 — do not re-derive the fluid formula.
- Do NOT add media queries — fluidity is achieved via `clamp()` alone (responsiveness is step 82).
- CSS Modules / plain CSS only; no inline styles, no Tailwind, no JS changes.
- Do NOT change colors, spacing, `cursor: none`, or any non-typography rule.
- `font-weight` and `line-height` tokens are defined here but component migration (replacing hardcoded values) is out of scope — deferred.

## Build steps
1. In `apps/frontend/src/index.css` `:root`, replace the 5 existing `--font-size-*` declarations with these 7 fluid tokens (fluid formula: `calc(min + (max - min) * (100vw - 23.4375rem) / 56.5625)`, where `23.4375rem` = 375px and `80rem` = 1280px, giving the constant `56.5625`):
   ```css
   --font-size-xs:   clamp(0.6875rem, calc(0.6875rem + 0.0625rem * (100vw - 23.4375rem) / 56.5625), 0.75rem);
   --font-size-sm:   clamp(0.8125rem, calc(0.8125rem + 0.0625rem * (100vw - 23.4375rem) / 56.5625), 0.875rem);
   --font-size-base: clamp(0.9375rem, calc(0.9375rem + 0.0625rem * (100vw - 23.4375rem) / 56.5625), 1rem);
   --font-size-lg:   clamp(1rem,      calc(1rem      + 0.125rem  * (100vw - 23.4375rem) / 56.5625), 1.125rem);
   --font-size-xl:   clamp(1.25rem,   calc(1.25rem   + 0.25rem   * (100vw - 23.4375rem) / 56.5625), 1.5rem);
   --font-size-2xl:  clamp(1.5rem,    calc(1.5rem    + 0.5rem    * (100vw - 23.4375rem) / 56.5625), 2rem);
   --font-size-hero: clamp(2rem,      calc(2rem      + 2rem      * (100vw - 23.4375rem) / 56.5625), 4rem);
   ```
2. In the same `:root`, add line-height tokens after the font-size block:
   ```css
   --line-height-tight: 1.2;
   --line-height-snug:  1.4;
   --line-height-base:  1.5;
   ```
3. In the same `:root`, add font-weight tokens:
   ```css
   --font-weight-regular:   400;
   --font-weight-medium:    500;
   --font-weight-semibold:  600;
   --font-weight-bold:      700;
   ```
4. Add `line-height: var(--line-height-base);` to the `body` rule in `index.css`.
5. In `apps/frontend/src/components/EmptyState.module.css`, change `.icon { font-size: 2rem; }` → `.icon { font-size: var(--font-size-2xl); }` (keep `line-height: 1;`).
6. In `apps/frontend/src/components/RaceHeader.module.css`, change `.name { font-size: var(--font-size-xl); }` → `.name { font-size: var(--font-size-2xl); }`.
7. Run `pnpm --filter frontend lint` and `pnpm --filter frontend build`; confirm both pass.

## Notes for the implementer
- The `clamp()` preferred term mixes `rem` and `vw` units inside `calc()` — this is valid CSS. Do not collapse to a single unit.
- `56.5625` must be identical across all 7 tokens (it is the constant `80 - 23.4375`).
- `--font-size-lg` and `--font-size-2xl` have no consumers before this step; after the step, `EmptyState .icon` and `RaceHeader .name` both consume `--font-size-2xl`.
- `line-height: 1` on `EmptyState .icon` stays as a literal — no `--line-height-*` token equals `1`, and it is intentional for icon/glyph sizing.
- The `body` `line-height: var(--line-height-base)` is a soft default; any component with its own explicit `line-height` overrides it locally, so impact is limited to currently-unset elements.
- Out of scope: migrating hardcoded `font-weight` (500/600/700) and `line-height` (1.2/1.4) values in existing components to the new tokens — deferred to a follow-up or step 82/83.
