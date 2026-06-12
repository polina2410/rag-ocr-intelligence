# Implementation Task: Configure turbo.json Build/Dev/Lint Pipelines

## What to build

Replace the skeleton `turbo.json` at the repo root with a complete task pipeline definition covering `build`, `dev`, `lint`, plus the missing `typecheck` and `test` tasks that the workspace scripts already expose. Wire correct `dependsOn` graphs, cache outputs, and `persistent`/`cache` flags so `turbo run <task>` works across all four runnable workspaces. This document is the specification — build what it describes.

## Current state

- **Root `turbo.json`** (turbo ^2.5.4) — skeleton with only `build`, `dev`, `lint`; `lint.dependsOn` is `[]`, no `outputs`/`inputs`/`cache` tuning beyond defaults ✅ partially
- **Root `package.json`** scripts: `dev` → `turbo dev`, `build` → `turbo build`, `lint` → `turbo lint`. No `format`/`typecheck`/`test` root scripts yet
- **`apps/frontend`** scripts: `dev`, `build` (`tsc -b && vite build` → `dist/`), `lint`, `preview`. No `test`, no `typecheck`
- **`apps/backend`** scripts: `build` (`nest build` → `dist/`), `start:dev` (NO `dev` script), `lint` (`eslint --fix`),  `test`, `test:cov`. No `typecheck`
- **`packages/types`** scripts: `lint`,  `typecheck`. No `build` — source-only package consumed via `exports: "./src/index.ts"`
- **`packages/eslint-config`**, **`packages/prettier-config`** — no scripts at all

## Deliverables (definition of done)

1. `turbo.json` defines tasks: `build`, `dev`, `lint`,  `typecheck`, `test`
2. ✅ `build`: `dependsOn: ["^build"]`, `outputs: ["dist/**"]` — extend, don't lose the existing dep
3. ✅ `dev`: `cache: false`, `persistent: true` — already correct, keep as-is
4. `lint`: `dependsOn: ["^build"]`, `cache: false` (runs `--fix`, mutates files), `outputs: []`
5. `typecheck`: `dependsOn: ["^build"]`, `outputs: []`
6. `test`: `dependsOn: ["^build"]`, `outputs: ["coverage/**"]`
7. Root `package.json` gains: `"typecheck": "turbo typecheck"`, `"test": "turbo test"`
8. `turbo run build` exits 0; only frontend + backend produce `dist/`; config-only packages skipped without error
9. `turbo run lint` runs in frontend, backend, and `@ocr/types`; config-only packages skipped without error
10. `turbo run dev` starts frontend (vite) and backend concurrently as persistent tasks

## Rules that must hold

- **`$schema` stays** `https://turbo.build/schema.json`
- **Turbo 2.x vocabulary only** — key is `"tasks"` (not deprecated `"pipeline"`)
- **Do not invent scripts in turbo.json** — Turbo only runs a task in a package if that package has a matching script. Backend has no `dev` script — add `"dev": "nest start --watch"` to `apps/backend/package.json` (see Build step 4)
- **No `test` task in frontend** — frontend has no `test` script; Turbo skips it silently, which is correct. Do NOT add a placeholder
- **`lint` must be `cache: false`** — write files in place; caching would cause stale-cache surprises
- **Backward-compat** — existing root `pnpm build`, `pnpm dev`, `pnpm lint` must keep working

## Build steps

1. Rewrite `turbo.json` `tasks` block with all five tasks from Deliverables 1–6
2. Add `coverage/**` to `test` outputs and confirm `dist/**` covers both frontend and backend builds
3. Add `"dev": "nest start --watch"` to `apps/backend/package.json` so `turbo dev` starts both apps
4. Add to root `package.json` scripts: `"typecheck": "turbo typecheck"`, `"test": "turbo test"`
5. Run `turbo run lint`, `turbo run build`, `turbo run typecheck`, `turbo run test` — confirm each exits 0
6. Run `turbo run dev` — confirm both frontend and backend start as persistent tasks, then cancel

## Notes for the implementer

**Out of scope:** Remote caching / Vercel `remoteCache`; CI integration; adding a `build` step to `@ocr/types`; adding tests to frontend; `inputs` micro-optimisation; env var declarations.

**Files likely affected:** `turbo.json`, `package.json` (root), `apps/backend/package.json` (adding `dev` alias)

**Gotchas:**
- Turbo silently skips packages lacking a matching script — expected for config-only packages and for `test`/`typecheck` in packages that don't have them. Verify by output, don't assume failure
- `tsc -b` in the frontend build writes `.tsbuildinfo`; if incremental caching misbehaves, add it to `outputs`, but don't block on it for MVP
- Backend `lint` uses `--fix` — setting `cache: false` on `lint` is the safe choice

**Open questions:**
1. Should `lint` depend on `^build`? The shared ESLint config uses type-aware rules against `@ocr/types` — confirm whether types need to be built first or the `paths` alias in tsconfig is sufficient
2. Should `turbo run dev` also start a database health-check or is Docker Compose assumed to be running independently?