import js from '@eslint/js';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';

export default [
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      '.build/**',
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
    ignores: ['src/entry-server.jsx'],
    languageOptions: { globals: globals.browser },
  },
  {
    files: [
      'scripts/**/*.mjs',
      'tests/**/*.mjs',
      '*.js',
      'src/entry-server.jsx',
    ],
    languageOptions: { globals: globals.node },
  },
  {
    files: ['src/**/*.{js,jsx}'],
    plugins: { 'react-hooks': reactHooks },
    rules: reactHooks.configs.recommended.rules,
  },
  {
    files: ['src/**/*.jsx'],
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
