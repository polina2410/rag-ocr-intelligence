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

/** Frontend config — extends base, adds browser globals */
const react = [
  ...base,
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