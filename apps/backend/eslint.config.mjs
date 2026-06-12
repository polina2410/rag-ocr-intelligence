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