# Implementation Task: Shared Prettier Config

## What to build

Create `packages/prettier-config/` — a shared Prettier configuration package (`@ocr/prettier-config`) that exports a single config object. Both apps and `packages/types` reference it via the `prettier` key in their `package.json`, replacing the backend's standalone `.prettierrc`. This document is the specification — build what it describes.

## Current state

- **Root** — no `prettier` dependency, no Prettier config
- **`apps/backend/`** — `prettier ^3.4.2` (devDep), `.prettierrc` (`{ "singleQuote": true, "trailingComma": "all" }`), `format` script, `eslint-plugin-prettier ^5.2.2` + `eslint-config-prettier ^10.0.1`; `eslint.config.mjs` uses `eslint-plugin-prettier/recommended` with `'prettier/prettier': ['error', { endOfLine: 'auto' }]`
- **`apps/frontend/`** — no `prettier` dep, no config, no `format` script
- **`packages/types/`** — no `prettier` dep, no config, no `format` script
- **`packages/eslint-config/`** — structural reference: `private: true`, `type: module`, `exports: { ".": "./index.js" }`, peer-deps only — mirror this pattern

## Deliverables (definition of done)

1. `packages/prettier-config/` exists as a workspace package named `@ocr/prettier-config` (`private: true`, `type: module`, `exports: { ".": "./index.js" }`)
2. The shared config preserves existing backend settings: `singleQuote: true`, `trailingComma: 'all'`
3. `@ocr/prettier-config/package.json` lists `prettier` as `peerDependency` (`>=3`) only — no direct dep
4. `apps/backend/` — `.prettierrc` deleted, `"prettier": "@ocr/prettier-config"` added to `package.json`, `@ocr/prettier-config: workspace:*` in devDependencies
5. `apps/frontend/` — gains `prettier ^3`, `@ocr/prettier-config: workspace:*`, shared-config reference, and `format` script
6. `packages/types/` — gains `prettier ^3`, `@ocr/prettier-config: workspace:*`, shared-config reference, and `format` script
7. `prettier --check` resolves the shared config without errors in all three consumers
8. `pnpm --filter backend lint` still passes after the change

## Rules that must hold

- **Single source of truth.** One config object in `@ocr/prettier-config`. No package may redefine option values locally.
- **No standalone `.prettierrc` left behind.** The backend's `.prettierrc` must be deleted, not left alongside the new reference.
- **Peer-deps only in the shared package.** `@ocr/prettier-config` must not bundle or pin `prettier`.
- **Do not change formatting rules.** `singleQuote: true` and `trailingComma: 'all'` must survive — changing them would reformat existing backend files.
- **Backend ESLint integration must keep working.** `eslint-plugin-prettier/recommended` reads the resolved Prettier config; verify `pnpm --filter backend lint` still passes.
- **ESM conventions.** Config package is `type: module` like `@ocr/eslint-config`.

## Build steps

1. Create `packages/prettier-config/package.json` (`@ocr/prettier-config`, `private: true`, `type: module`, `exports: { ".": "./index.js" }`, `peerDependencies: { "prettier": ">=3" }`)
2. Create `packages/prettier-config/index.js` exporting the config as default with at minimum `singleQuote: true` and `trailingComma: 'all'`
3. In `apps/backend/package.json`: add `@ocr/prettier-config: workspace:*` to devDependencies, add `"prettier": "@ocr/prettier-config"`, delete `apps/backend/.prettierrc`
4. In `apps/frontend/package.json`: add `prettier ^3` and `@ocr/prettier-config: workspace:*` to devDependencies, add `"prettier": "@ocr/prettier-config"`, add `format` script
5. In `packages/types/package.json`: add `prettier ^3` and `@ocr/prettier-config: workspace:*` to devDependencies, add `"prettier": "@ocr/prettier-config"`, add `format` script
6. Run `pnpm install` from repo root
7. Run `prettier --check` in each consumer; run `pnpm --filter backend lint` — fix any errors

## Notes for the implementer

**Out of scope:** mass reformatting (`--write` run), Turbo pipeline tasks for `format`, Prettier plugins, root-level aggregate `format` script.

**Files likely affected:**
- New: `packages/prettier-config/package.json`, `packages/prettier-config/index.js`
- Modified: `apps/backend/package.json`, `apps/frontend/package.json`, `packages/types/package.json`
- Deleted: `apps/backend/.prettierrc`

**Gotchas:**
- Prettier resolves a string in `"prettier"` package.json key as a module — `@ocr/prettier-config` must export a plain object as its default export.
- `endOfLine`: the backend ESLint rule already sets `endOfLine: 'auto'`. Consider adding it to the shared Prettier config too for Windows consistency — but confirm it doesn't conflict with existing line endings.
- `packages/prettier-config/node_modules` won't exist until `pnpm install`; no build step needed (plain JS).

**Open questions:**
1. `"prettier": "@ocr/prettier-config"` package.json key (recommended) vs. a `prettier.config.mjs` re-export file — pick one and apply uniformly.
2. Should `endOfLine: 'auto'` be added to the shared config given the Windows dev environment?