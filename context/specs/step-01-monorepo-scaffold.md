# Implementation Task: Turborepo Monorepo Scaffold

## What to build

Initialize a Turborepo monorepo with three packages: `apps/frontend` (Vite + React + TypeScript), `apps/backend` (NestJS), and `packages/types` (shared DTOs). This document is the specification — build what it describes. Do not summarize it back; produce the actual files.

## Deliverables (definition of done)

1. **Root `package.json`** — private, declares pnpm workspaces pointing at `apps/*` and `packages/*`, has `dev`, `build`, and `lint` scripts that delegate to Turbo.
2. **`pnpm-workspace.yaml`** — declares `apps/*` and `packages/*` as workspace packages.
3. **`turbo.json`** — pipeline config with `build`, `dev`, and `lint` tasks. `dev` runs persistently. `build` depends on upstream `^build`. `lint` has no dependencies.
4. **`apps/frontend/`** — Vite + React + TypeScript app. Imports `@ocr/types` via workspace alias.
5. **`apps/backend/`** — NestJS app scaffolded with the NestJS CLI. Imports `@ocr/types` via workspace alias.
6. **`packages/types/`** — shared types package. Exports `RaceDto` and `AthleteDto` as a starting point. Has its own `package.json` with name `@ocr/types` and a `tsconfig.json`.
7. **Root `.gitignore`** — covers `node_modules`, `dist`, `.turbo`, `.env`, `*.tsbuildinfo`.

The task is complete when `pnpm install` runs cleanly from the root, `pnpm dev` starts both apps in parallel, and both `apps/frontend` and `apps/backend` can import from `@ocr/types` without TypeScript errors.

## Rules that must hold (read before implementing)

- **Package name is `@ocr/types`**, not `@repo/types` or anything else. Both apps import from this exact name.
- **Do not use `npm` or `yarn`**. This project uses pnpm exclusively. All commands and lockfiles must be pnpm.
- **`packages/types` has no build step.** It exports raw TypeScript source directly via the `exports` field in `package.json` — no `tsc` compile, no `dist/` folder. Both apps consume it through TypeScript path resolution.
- **Do not scaffold frontend from scratch.** Use `pnpm create vite` with the `react-ts` template. Do not hand-write the Vite config or `index.html`.
- **Do not scaffold backend from scratch.** Use `pnpm dlx @nestjs/cli new` with `--package-manager pnpm --skip-git`. Do not hand-write the NestJS boilerplate.
- **`turbo.json` must declare `dev` as persistent.** Without `"persistent": true` on the dev task, Turbo will not run long-running processes correctly.
- **All packages extend from the root TypeScript config.** Root `tsconfig.json` sets the base `compilerOptions`. Each package extends it and adds only what it needs.

---

## Folder structure (exact)

```
ocr-intelligence/
├── apps/
│   ├── frontend/          # Vite + React + TS (from vite template)
│   └── backend/           # NestJS (from @nestjs/cli)
├── packages/
│   └── types/
│       ├── src/
│       │   ├── index.ts
│       │   ├── race.dto.ts
│       │   └── athlete.dto.ts
│       ├── package.json
│       └── tsconfig.json
├── .gitignore
├── package.json
├── pnpm-workspace.yaml
├── tsconfig.json          # base config, extended by all packages
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
Re-exports everything:
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

## Root `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "skipLibCheck": true,
    "esModuleInterop": true
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

1. Create root folder structure and `pnpm-workspace.yaml`.
2. Write root `package.json`, `tsconfig.json`, `turbo.json`, `.gitignore`.
3. Scaffold frontend with `pnpm create vite apps/frontend -- --template react-ts`.
4. Scaffold backend with `pnpm dlx @nestjs/cli new apps/backend --package-manager pnpm --skip-git`.
5. Create `packages/types/` with folder structure, DTOs, and `package.json` above.
6. Run `pnpm install` from root to link all workspaces.
7. Add `@ocr/types` to the `dependencies` of both `apps/frontend/package.json` and `apps/backend/package.json` as `"@ocr/types": "workspace:*"`.
8. Verify the smoke-test imports compile without errors, then remove them.
9. Run `pnpm dev` and confirm both apps start.

## Notes for the implementer

- If `pnpm install` complains about the `exports` field in `packages/types/package.json`, add `"main": "./src/index.ts"` as a fallback alongside `exports`.
- The NestJS CLI may create its own `.git` folder inside `apps/backend` despite `--skip-git`. Delete it if present — there should be only one `.git` at the root.
- Frontend will start on port `5173` (or the next available), backend on `3000`. No port changes needed at this step.
- If WebStorm doesn't resolve `@ocr/types`, go to **File → Settings → Languages & Frameworks → TypeScript** and point it at `apps/frontend/node_modules/typescript`. This is an IDE config issue, not a build issue.
