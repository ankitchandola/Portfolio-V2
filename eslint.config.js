import js from '@eslint/js';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default [
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      '.build/**',
      'playwright-report/**',
      'test-results/**',
      '.sites-runtime/**',
      '.claude/**',
      '.copilot/**',
      '.taste-skill/**',
    ],
  },
  {
    files: [
      'src/**/*.{js,jsx}',
      'scripts/**/*.mjs',
      'tests/**/*.mjs',
      '*.js',
      'public/assets/theme.js',
    ],
    rules: js.configs.recommended.rules,
  },
  {
    files: ['src/**/*.{js,jsx}', 'public/assets/theme.js'],
    languageOptions: { globals: globals.browser },
  },
  {
    files: ['scripts/**/*.mjs', 'tests/**/*.mjs', '*.js'],
    languageOptions: { globals: globals.node },
  },
  {
    files: ['tests/browser/**/*.mjs'],
    languageOptions: { globals: globals.browser },
  },
  {
    files: ['src/**/*.{js,jsx}'],
    plugins: { 'react-hooks': reactHooks },
    rules: reactHooks.configs.recommended.rules,
  },
  ...tseslint.configs.recommendedTypeChecked.map((config) => ({
    ...config,
    files: ['src/**/*.{ts,tsx}', 'tests/**/*.ts'],
  })),
  {
    files: ['src/**/*.{ts,tsx}', 'tests/**/*.ts'],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.app.json', './tsconfig.node.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: { 'react-hooks': reactHooks },
    rules: {
      ...reactHooks.configs.recommended.rules,
      '@typescript-eslint/switch-exhaustiveness-check': 'error',
    },
  },
  {
    files: ['src/**/*.{jsx,tsx}'],
    languageOptions: { parserOptions: { ecmaFeatures: { jsx: true } } },
    plugins: {
      react,
      'jsx-a11y': jsxA11y,
    },
    rules: {
      'react/jsx-uses-react': 'error',
      'react/jsx-uses-vars': 'error',
      ...jsxA11y.flatConfigs.recommended.rules,
    },
  },
];
