# Features History

<!-- Completed features are appended here by /feature complete -->

## Turborepo Monorepo Scaffold

**Branch:** turborepo-monorepo-scaffold
**Completed:** 2026-06-12

### Goals

- Move `frontend/` → `apps/frontend/`, `backend/` → `apps/backend/`
- Add `packages/types/` with `@ocr/types` (RaceDto, AthleteDto)
- Configure Turbo pipeline, root tsconfig base, updated pnpm-workspace.yaml
- Backend resolves `@ocr/types` via `paths` alias in tsconfig
- Both apps import from `@ocr/types` without TypeScript errors

### Summary

Wired existing Vite/React and NestJS apps into a Turborepo monorepo under `apps/`. Created shared `@ocr/types` package with initial DTOs. Root `tsconfig.json` acts as a minimal base; each app extends it with its own resolution strategy. `pnpm install` resolves all 4 workspace packages cleanly. Lint and build pass.

---

## Shared ESLint Config

**Branch:** shared-eslint-config
**Completed:** 2026-06-12

### Goals

- Create `packages/eslint-config/` (`@ocr/eslint-config`) exporting `base`, `react`, and `nestjs` flat configs
- Replace `apps/frontend/eslint.config.js` with a thin wrapper importing `@ocr/eslint-config/react`
- Replace `apps/backend/eslint.config.mjs` with a thin wrapper importing `@ocr/eslint-config/nestjs`
- Add `packages/types/eslint.config.js` using `@ocr/eslint-config/base` + `lint` script
- Align ESLint to `^10` in both apps (backend was on `^9`)
- All three `lint` commands pass with 0 errors

### Summary

Created `@ocr/eslint-config` as a peer-dep-only package exporting three flat configs. Frontend and backend configs replaced with thin wrappers. ESLint aligned to v10 across the monorepo. `no-explicit-any: error` now enforced everywhere (was `off` in backend). Added `"types": ["jest", "node"]` to backend tsconfig to fix `projectService` not discovering jest globals as ambient types. All three lint commands pass: frontend (0 errors), backend (0 errors, 1 expected `no-floating-promises` warning on `bootstrap()`), `@ocr/types` (0 errors).

---

## Shared Prettier Config

**Branch:** shared-prettier-config
**Completed:** 2026-06-12

### Goals

- Create `packages/prettier-config/` (`@ocr/prettier-config`) exporting a single config as default
- Backend `.prettierrc` deleted, replaced by `"prettier": "@ocr/prettier-config"` in package.json
- Frontend and `packages/types` gain `prettier ^3`, shared config reference, and `format` script
- `prettier --check` resolves without errors in all three consumers
- `pnpm --filter backend lint` still passes

### Summary

Created `@ocr/prettier-config` as a peer-dep-only package (mirrors `@ocr/eslint-config` pattern). Preserves existing backend settings: `singleQuote: true`, `trailingComma: 'all'`, adds `endOfLine: 'auto'` for Windows consistency. All consumers reference it via the `"prettier"` key in their `package.json`. Backend `.prettierrc` deleted. Pre-existing formatting issues in frontend and types are out of scope (no mass reformat). Backend lint passes (0 errors).

---

## Turbo Pipelines

**Branch:** turbo-pipelines
**Completed:** 2026-06-12

### Goals

- `turbo.json` defines `build`, `dev`, `lint`, `typecheck`, `test` with correct `dependsOn`, `cache`, and `outputs`
- `apps/backend/package.json` gains `"dev": "nest start --watch"` so `turbo dev` starts both apps
- Root `package.json` gains `"typecheck": "turbo typecheck"` and `"test": "turbo test"` scripts
- All four `turbo run` commands exit 0

### Summary

Replaced the skeleton `turbo.json` with a complete pipeline. `lint` set to `cache: false` (backend runs `--fix`). `typecheck` and `test` added with `dependsOn: ["^build"]`. `lint.dependsOn` kept as `[]` — type-aware ESLint rules resolve `@ocr/types` via tsconfig `paths` alias, no compiled output needed. Backend `dev` alias added. Removed `outputs: ["coverage/**"]` from `test` task after confirming the plain `jest` script doesn't produce coverage files. All four commands pass: `build` (frontend + backend), `lint` (frontend, backend, types), `typecheck` (types), `test` (backend 1/1).

---

## Race TypeORM Entity

**Branch:** race-entity
**Completed:** 2026-06-13

### Goals

- `apps/backend/src/entities/race.entity.ts` — named `Race` class, `@Entity('races')`
- UUID primary key + 6 typed columns matching `RaceDto`, snake_case DB names
- `raceType` typed as `RaceDto['raceType']`, stored as `varchar`
- All numeric constraints in named `const`s, no audit columns
- `build` and `lint` pass

### Summary

Created `Race` entity with all columns matching `RaceDto`. `raceType` stored as `varchar(20)` for flexibility. Properties use definite assignment (`!`) since TypeORM initialises them. Also fixed `packages/types/src/index.ts` to use `.js` extensions on relative imports — required by `module: nodenext` after `"type": "module"` was added to the types package in step 4. Build and lint pass with 0 errors.

---

## Athlete TypeORM Entity

**Branch:** athlete-entity
**Completed:** 2026-06-13

### Goals

- `apps/backend/src/entities/athlete.entity.ts` — named `Athlete` class, `@Entity('athletes')`
- UUID primary key + 4 typed columns matching `AthleteDto`, snake_case DB names (`first_name`, `last_name`)
- `category` typed as `AthleteDto['category']`, stored as `varchar`
- All varchar lengths extracted to named `const`s (255), no magic numbers
- `build` and `lint` pass

### Summary

Created `Athlete` entity following Race entity conventions exactly. All five columns use `varchar` with named length constants. `firstName` and `lastName` get explicit `name:` overrides for snake_case DB columns. `category` typed via `AthleteDto['category']` for DTO alignment without introducing a Postgres enum. Build and lint pass with 0 errors.

---

## RaceResult TypeORM Entity

**Branch:** race-result-entity
**Completed:** 2026-06-13

### Goals

- `apps/backend/src/entities/race-result.entity.ts` — named `RaceResult` class, `@Entity('race_results')`
- UUID primary key
- FK → `Race`: unidirectional `@ManyToOne` + `@JoinColumn({ name: 'race_id' })` + scalar `raceId: string`
- FK → `Athlete`: unidirectional `@ManyToOne` + `@JoinColumn({ name: 'athlete_id' })` + scalar `athleteId: string`
- Result columns: `overallPosition`, `finishTimeSeconds`, `status`, `categoryPosition`, `genderPosition`
- `status` as `varchar` union (`'FINISHED' | 'DNF' | 'DNS' | 'DSQ'`), default `'FINISHED'`
- All lengths in named constants, build and lint pass

### Summary

Created `RaceResult` as the join/fact table between `Race` and `Athlete`. Relations are unidirectional from `RaceResult` — no changes to existing entities. Each FK has both a relation property and a scalar uuid column for projection ergonomics. Nullable int columns for positions and finish time; status stored as varchar with a default. Build and lint pass with 0 errors.

---

## ObstacleSplit TypeORM Entity

**Branch:** obstacle-split-entity
**Completed:** 2026-06-13

### Goals

- `apps/backend/src/entities/obstacle-split.entity.ts` — named `ObstacleSplit` class, `@Entity('obstacle_splits')`
- UUID primary key
- FK → `RaceResult`: unidirectional `@ManyToOne` + `@JoinColumn({ name: 'race_result_id' })` + scalar `raceResultId: string`
- `obstacleNumber: number` — 1-based ordinal, int
- `obstacleName: string` — varchar(255), named constant
- `splitTimeSeconds: number | null` — nullable int, per-obstacle duration in seconds
- `penaltyCount: number` — int, default 0 (count from CSV; boolean `penalty` column dropped as redundant)
- Build and lint pass

### Summary

Created `ObstacleSplit` as the per-obstacle fact table linked to `RaceResult` (not directly to Race/Athlete). Relation is unidirectional — no changes to existing entities. Dropped the specced boolean `penalty` column in favour of `penaltyCount` alone (count > 0 implies a penalty, avoids redundancy). `splitTimeSeconds` stores per-obstacle duration. Build and lint pass with 0 errors.

---