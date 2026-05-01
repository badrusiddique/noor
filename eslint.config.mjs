import { FlatCompat } from '@eslint/eslintrc';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import prettierConfig from 'eslint-config-prettier';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const compat = new FlatCompat({ baseDirectory: __dirname });

export default [
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      '.expo/**',
      'ios/**',
      'android/**',
      'coverage/**',
      'data/cache/**',
      '*.config.js',
      '*.config.cjs',
      'jest.setup.ts',
      'metro.config.js',
      'babel.config.js',
    ],
  },
  ...compat.extends('expo'),
  prettierConfig,
  {
    rules: {
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },
  {
    // The logger module is the one place console.* is unrestricted —
    // it is the wrapper that everything else routes through.
    files: ['src/lib/logger.ts'],
    rules: {
      'no-console': 'off',
    },
  },
];
