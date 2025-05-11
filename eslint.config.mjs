import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';
import prettierPlugin from 'eslint-plugin-prettier';
import eslintRecommended from '@eslint/js';

export default [
  {
    files: ['**/*.{js,ts}'],

    ignores: [
      'jest.config.js',
    ],

    languageOptions: {
      parser: tsparser,
      sourceType: 'module',
      parserOptions: {
        project: './tsconfig.json',
      },
    },

    plugins: {
      '@typescript-eslint': tseslint,
      prettier: prettierPlugin,
    },

    rules: {
      ...eslintRecommended.rules,
      ...tseslint.configs.recommended.rules,
      '@typescript-eslint/interface-name-prefix': 'off',
      '@typescript-eslint/explicit-function-return-type': 'error',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': 'error',
      'no-console': 'warn',
      'no-restricted-syntax': [
        'error',
        'ForInStatement',
        'LabeledStatement',
        'WithStatement',
      ],
      semi: ['error', 'always'],
      quotes: ['error', 'single'],
      'prettier/prettier': 'error',
    },
  },
  {
    files: ['**/*.{js,ts}'],
    plugins: {
      prettier: prettierPlugin,
    },
    rules: {
      'prettier/prettier': 'error',
    },
  },
];
