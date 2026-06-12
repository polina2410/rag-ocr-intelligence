# Implementation Task: Shared ESLint Config

## What to build

Create `packages/eslint-config/` — a shared ESLint flat-config package (`@ocr/eslint-config`) that exports three named configs: `base`, `react`, and `nestjs`. Both apps replace their standalone ESLint configs with thin wrappers that import from this package. This document is the specification — build what it describes.

## Current state

- `apps/frontend/eslint.config.js` — standalone flat config, ESLint v10
- `apps/backend/eslint.config.mjs` — standalone flat config, ESLint v9
- No root ESLint config
- `packages/types/` has no ESLint config
- **Version mismatch:** frontend is on `eslint ^10`, backend on `eslint ^9` — align both to `^10` as part of this task

## Deliverables (definition of done)

1. **`packages/eslint-config/`** — new workspace package exporting `base`, `react`, and `nestjs` config objects.
2. **`apps/frontend/eslint.config.js`** — replaced with a thin wrapper that spreads `@ocr/eslint-config/react`.
3. **`apps/backend/eslint.config.mjs`** — replaced with a thin wrapper that spreads `@ocr/eslint-config/nestjs`.
4. **`packages/types/`** — gets a minimal `eslint.config.js` using `@ocr/eslint-config/base`.
5. **ESLint version aligned to `^10`** in both apps.
6. `pnpm --filter frontend lint`, `pnpm --filter backend lint`, and `pnpm --filter @ocr/types lint` all pass with 0 errors.

## Rules that must hold

- **Flat config only.** All configs use ESLint's flat config format — no `.eslintrc.*` files anywhere.
- **`@ocr/eslint-config` has no `eslint` dependency.** It lists `eslint` and `typescript-eslint` as `peerDependencies` only — each app brings its own version.
- **Do not weaken existing rules.** The existing configs already have rules; the shared config must preserve or strengthen them, never loosen them silently.
- **`@typescript-eslint/no-explicit-any` must be `error`** in all packages. The backend currently has it set to `"off"` — fix this.
- **Backend keeps `prettier` integration.** The `nestjs` config must retain `eslint-plugin-prettier/recommended`.
- **Backend keeps type-checked rules.** `tseslint.configs.recommendedTypeChecked` and `parserOptions.projectService` must remain in the `nestjs` config.

---

## Folder structure

```
packages/
  eslint-config/
    package.json        # name: "@ocr/eslint-config"
    index.js            # exports: { base, react, nestjs }
```

No `src/`, no TypeScript compilation — plain `.js` exports only.

---

## `packages/eslint-config/package.json`

```json
{
  "name": "@ocr/eslint-config",
  "version": "0.0.1",
  "private": true,
  "type": "module",
  "exports": {
    ".": "./index.js"
  },
  "peerDependencies": {
    "@eslint/js": ">=10",
    "eslint": ">=10",
    "typescript-eslint": ">=8",
    "globals": ">=14"
  }
}
```

Prettier and React plugins are consumed only by the apps that need them, so they are **not** peer deps of this package — they stay in the individual apps.

---

## `packages/eslint-config/index.js`

```js
import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import globals from 'globals'

/** Shared base rules — applied in all packages */
const base = tseslint.config(
  js.configs.recommended,
  tseslint.configs.recommended,
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
)

/** Frontend config — extends base, adds React plugins */
const react = [
  ...base,
  // Caller (apps/frontend/eslint.config.js) must spread React plugin configs after this
  {
    languageOptions: {
      globals: globals.browser,
    },
  },
]

/** Backend config — extends base, adds Node globals and type-checked rules */
const nestjs = tseslint.config(
  js.configs.recommended,
  tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
      sourceType: 'commonjs',
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-floating-promises': 'warn',
      '@typescript-eslint/no-unsafe-argument': 'warn',
    },
  },
)

export { base, react, nestjs }
```

---

## `apps/frontend/eslint.config.js` (replacement)

```js
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { react } from '@ocr/eslint-config'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  ...react,
  reactHooks.configs.flat.recommended,
  reactRefresh.configs.vite,
])
```

---

## `apps/backend/eslint.config.mjs` (replacement)

```js
// @ts-check
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended'
import { nestjs } from '@ocr/eslint-config'

export default [
  { ignores: ['eslint.config.mjs', 'dist'] },
  ...nestjs,
  eslintPluginPrettierRecommended,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      'prettier/prettier': ['error', { endOfLine: 'auto' }],
    },
  },
]
```

---

## `packages/types/eslint.config.js` (new)

```js
import { base } from '@ocr/eslint-config'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  ...base,
])
```

Add `"lint": "eslint ."` to `packages/types/package.json` scripts.

---

## Build steps

1. Create `packages/eslint-config/` with `package.json` and `index.js` above.
2. Add `"@ocr/eslint-config": "workspace:*"` to `devDependencies` of `apps/frontend/package.json`, `apps/backend/package.json`, and `packages/types/package.json`.
3. Align `apps/frontend/package.json`: change `"eslint"` to `"^10"` and `"@eslint/js"` to `"^10"` if not already aligned (check — pnpm install may have already resolved v10).
4. Change `"eslint"` in `apps/backend/package.json` from `"^9.18.0"` to `"^10"` and `"@eslint/js"` from `"^9.18.0"` to `"^10"`.
5. Replace `apps/frontend/eslint.config.js` with the wrapper above.
6. Replace `apps/backend/eslint.config.mjs` with the wrapper above.
7. Create `packages/types/eslint.config.js`.
8. Add `"lint": "eslint ."` to `packages/types/package.json` scripts.
9. Run `pnpm install` from root.
10. Run `pnpm --filter frontend lint`, `pnpm --filter backend lint`, `pnpm --filter @ocr/types lint` — fix any errors.

## Notes for the implementer

- The `react` export in `index.js` is a plain array (not a `tseslint.config()` call) so it can be spread with `...react` inside `defineConfig`. If TypeScript type errors appear in the config file itself, wrap the array in `tseslint.config(...)` instead.
- The backend's `parserOptions.projectService` requires a `tsconfig.json` in the same directory. `apps/backend/tsconfig.json` already exists — no change needed.
- If `eslint-plugin-prettier` or `eslint-plugin-react-*` have peer dependency warnings after upgrading ESLint to v10, check their changelogs and bump if needed.
- `packages/eslint-config` intentionally has no `build` script — it ships plain JS source. Turbo's `lint` task will skip it unless a `lint` script is added later.