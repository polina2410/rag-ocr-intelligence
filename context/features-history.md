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