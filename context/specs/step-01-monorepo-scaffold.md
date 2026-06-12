# Implementation Task: Turborepo Monorepo Scaffold

## What to build

Wire the existing apps into a Turborepo monorepo with three packages: `apps/frontend` (Vite + React + TypeScript), `apps/backend` (NestJS), and `packages/types` (shared DTOs). This document is the specification — build what it describes. Do not summarize it back; produce the actual files.

## Decision log

- **Directory layout:** Apps live under `apps/` (not at root level). The existing `frontend/` and `backend/` directories must be moved to `apps/frontend/` and `apps/backend/` respectively.
- **Do not re-scaffold apps.** `apps/frontend` and `apps/backend` already exist with working code and dependencies. Skip `pnpm create vite` and `@nestjs/cli new` entirely — just move the directories and update workspace config.

## Deliverables (definition of done)

1. **Root `package.json`** — private, declares pnpm workspaces pointing at `apps/*` and `packages/*`, has `dev`, `build`, and `lint` scripts that delegate to Turbo.
2. **`pnpm-workspace.yaml`** — updated to declare `apps/*` and `packages/*` as workspace packages.
3. **`turbo.json`** — pipeline config with `build`, `dev`, and `lint` tasks. `dev` runs persistently. `build` depends on upstream `^build`. `lint` has no dependencies.
4. **`apps/frontend/`** — existing Vite + React + TypeScript app moved from `frontend/`. Imports `@ocr/types` via workspace alias.
5. **`apps/backend/`** — existing NestJS app moved from `backend/`. Imports `@ocr/types` via workspace alias.
6. **`packages/types/`** — shared types package. Exports `RaceDto` and `AthleteDto` as a starting point. Has its own `package.json` with name `@ocr/types` and a `tsconfig.json`.
7. **Root `tsconfig.json`** — base config with common options. Each app extends it and adds only what it needs (frontend adds `bundler` resolution, backend keeps its existing `nodenext` + decorator options).
8. **Root `.gitignore`** — augment the existing file to also cover `dist`, `.turbo`, `*.tsbuildinfo` (do not replace existing entries).

The task is complete when `pnpm install` runs cleanly from the root, `pnpm dev` starts both apps in parallel via Turbo, and both `apps/frontend` and `apps/backend` can import from `@ocr/types` without TypeScript errors.

## Rules that must hold (read before implementing)

- **Package name is `@ocr/types`**, not `@repo/types` or anything else. Both apps import from this exact name.
- **Do not use `npm` or `yarn`**. This project uses pnpm exclusively. All commands and lockfiles must be pnpm.
- **`packages/types` has no build step.** It exports raw TypeScript source directly via the `exports` field in `package.json`. The frontend (Vite/esbuild) resolves it at compile time. The backend resolves it via TypeScript path aliasing — do not rely on `nest build` picking it up via `rootDir`; use `paths` in the backend's `tsconfig.json` instead.
- **Do not re-scaffold.** Do not run `pnpm create vite` or `@nestjs/cli new`. The apps already exist — move them.
- **`turbo` must be a root devDependency.** Add `turbo` to the root `package.json` devDependencies so `pnpm dev` / `pnpm build` / `pnpm lint` resolve the binary without a global install.
- **`turbo.json` must declare `dev` as persistent.** Without `"persistent": true` on the dev task, Turbo will not run long-running processes correctly.
- **Two TypeScript configs, not one universal base.** The root `tsconfig.json` sets only the common base (`target`, `strict`, `skipLibCheck`, `esModuleInterop`). The backend **must** keep its existing `moduleResolution: "nodenext"`, `emitDecoratorMetadata`, and `experimentalDecorators` in its own `tsconfig.json` — do not override these from root.

---

## Folder structure (exact)

```
ocr-intelligence/
├── apps/
│   ├── frontend/          # moved from frontend/ — do not re-scaffold
│   └── backend/           # moved from backend/ — do not re-scaffold
├── packages/
│   └── types/
│       ├── src/
│       │   ├── index.ts
│       │   ├── race.dto.ts
│       │   └── athlete.dto.ts
│       ├── package.json
│       └── tsconfig.json
├── .gitignore             # augment existing
├── package.json
├── pnpm-workspace.yaml
├── tsconfig.json          # base config only, extended by each app
└── turbo.json
```

---

## `packages/types` — initial DTOs

### `race.dto.ts`
```typescript
export interface RaceDto {
  id: string
  name: string
  date: string
  location: string
  distanceKm: number
  totalObstacles: number
  raceType: 'Sprint' | 'Super' | 'DEKA' | 'Open'
}
```

### `athlete.dto.ts`
```typescript
export interface AthleteDto {
  id: string
  firstName: string
  lastName: string
  nationality: string
  category: string
}
```

### `index.ts`
```typescript
export * from './race.dto'
export * from './athlete.dto'
```

---

## `packages/types/package.json`

```json
{
  "name": "@ocr/types",
  "version": "0.0.1",
  "private": true,
  "exports": {
    ".": "./src/index.ts"
  },
  "main": "./src/index.ts",
  "scripts": {
    "lint": "tsc --noEmit"
  }
}
```

---

## `turbo.json`

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "dev": {
      "persistent": true,
      "cache": false
    },
    "lint": {
      "dependsOn": []
    }
  }
}
```

---

## Root `tsconfig.json` (base only)

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "strict": true,
    "skipLibCheck": true,
    "esModuleInterop": true
  }
}
```

Do not set `module` or `moduleResolution` here — each app sets its own.

---

## Backend `tsconfig.json` — `paths` for `@ocr/types`

The backend must keep its existing NestJS options and add a `paths` entry so TypeScript resolves the raw source:

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "module": "commonjs",
    "moduleResolution": "nodenext",
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "paths": {
      "@ocr/types": ["../../packages/types/src/index.ts"]
    }
  }
}
```

---

## Verify `@ocr/types` is importable

After scaffolding, add this import to `apps/frontend/src/main.tsx` and confirm no TypeScript error:

```typescript
import type { RaceDto } from '@ocr/types'
```

Add this import to `apps/backend/src/app.module.ts` and confirm no TypeScript error:

```typescript
import type { RaceDto } from '@ocr/types'
```

Remove both after verifying — they are smoke-test imports only.

---

## Build steps

1. Move `frontend/` → `apps/frontend/` and `backend/` → `apps/backend/`.
2. Update `pnpm-workspace.yaml` to declare `apps/*` and `packages/*`.
3. Update root `package.json`: add `dev`, `build`, `lint` scripts delegating to `turbo`; add `turbo` to devDependencies.
4. Write root `tsconfig.json` (base only, no `module`/`moduleResolution`).
5. Write `turbo.json`.
6. Augment root `.gitignore` — add `dist`, `.turbo`, `*.tsbuildinfo` if not already present.
7. Create `packages/types/` with folder structure, DTOs, and `package.json` above.
8. Update `apps/backend/tsconfig.json` to extend `../../tsconfig.json` and add `paths` for `@ocr/types`.
9. Update `apps/frontend/tsconfig.json` to extend `../../tsconfig.json` if it doesn't already.
10. Add `@ocr/types` to the `dependencies` of both `apps/frontend/package.json` and `apps/backend/package.json` as `"@ocr/types": "workspace:*"`.
11. Run `pnpm install` from root to link all workspaces.
12. Verify the smoke-test imports compile without errors, then remove them.
13. Run `pnpm dev` and confirm both apps start.

## Notes for the implementer

- If `pnpm install` complains about the `exports` field in `packages/types/package.json`, the `"main"` fallback field is already included above.
- The `nest build` command compiles only what's inside `rootDir: ./src`. `@ocr/types` is resolved by TypeScript via `paths` at type-check time; it does not need to be inside `rootDir`. For production runtime, types-only imports (interfaces) have no runtime representation and will not cause issues.
- If WebStorm doesn't resolve `@ocr/types`, go to **File → Settings → Languages & Frameworks → TypeScript** and point it at `apps/frontend/node_modules/typescript`. This is an IDE config issue, not a build issue.