# Current Feature: Turborepo Monorepo Scaffold

## Status
In Progress

## Goals

- Move `frontend/` → `apps/frontend/` and `backend/` → `apps/backend/`
- Update `pnpm-workspace.yaml` to declare `apps/*` and `packages/*`
- Add `turbo` to root devDependencies; add `dev`, `build`, `lint` scripts delegating to Turbo
- Write root `tsconfig.json` (base only — no `module`/`moduleResolution`)
- Write `turbo.json` with `build`, `dev` (persistent), and `lint` tasks
- Create `packages/types/` with `RaceDto`, `AthleteDto`, and `@ocr/types` package.json
- Update `apps/backend/tsconfig.json` to extend root and add `paths` for `@ocr/types`
- Add `"@ocr/types": "workspace:*"` to both apps' dependencies
- `pnpm install` runs cleanly from root
- Both apps can import from `@ocr/types` without TypeScript errors
- `pnpm dev` starts both apps in parallel via Turbo

## Notes

**Spec:** `context/specs/step-01-monorepo-scaffold.md`

**Do not re-scaffold.** The apps already exist — move them. Do not run `pnpm create vite` or `@nestjs/cli new`.

**TypeScript:** Root base config sets only `target`, `strict`, `skipLibCheck`, `esModuleInterop`. Backend keeps its own `moduleResolution: nodenext`, `emitDecoratorMetadata`, `experimentalDecorators`. Backend resolves `@ocr/types` via `paths`, not `rootDir`.

**`@ocr/types`:** Raw TypeScript source, no build step. Frontend resolves via esbuild. Backend resolves via `paths` in `tsconfig.json`. Package name must be exactly `@ocr/types`.

**`.gitignore`:** Augment existing — add `dist`, `.turbo`, `*.tsbuildinfo` only if not already present.

## History

<!-- Completed features are tracked in context/features-history.md -->