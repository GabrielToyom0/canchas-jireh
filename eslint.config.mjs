import { defineConfig } from 'eslint/config';
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from 'globals';
import prettier from 'eslint-config-prettier';

// El frontend tiene su propia configuración (React) en frontend/eslint.config.js.
export default defineConfig(
  {
    ignores: [
      '**/dist/**',
      '**/coverage/**',
      '**/generated/**',
      'frontend/**',
      'e2e/playwright-report/**',
      'e2e/test-results/**',
    ],
  },
  js.configs.recommended,
  tseslint.configs.recommended,
  { languageOptions: { globals: globals.node } },
  {
    rules: {
      // Prefijo "_" = valor ignorado a propósito (p. ej. el 4.º parámetro obligatorio de los manejadores de error de Express).
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', ignoreRestSiblings: true },
      ],
    },
  },
  prettier,
);
