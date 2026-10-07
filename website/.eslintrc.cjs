module.exports = {
  root: true,
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  plugins: ['@typescript-eslint', 'react', 'react-hooks'],
  settings: {
    react: {
      version: 'detect',
    },
  },
  rules: {
    'react/react-in-jsx-scope': 'off', // Not needed in modern React
    '@typescript-eslint/no-unused-vars': [
      'warn',
      { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
    ],
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-require-imports': 'off', // Docusaurus uses require for static assets
  },
  // Static guard: the book-date util shells to git (node:child_process), so
  // client bundles must never import it. Scoped to theme/components — the
  // config (Node side) is the only legit importer and stays unrestricted.
  overrides: [
    {
      files: ['src/theme/**/*', 'src/components/**/*'],
      rules: {
        'no-restricted-imports': [
          'error',
          {
            patterns: [
              {
                group: ['**/utils/bookLastUpdated*'],
                message:
                  'Node-only build util (spawns git). Import from docusaurus.config.ts only.',
              },
            ],
          },
        ],
      },
    },
  ],
  ignorePatterns: ['build/', '.docusaurus/', 'node_modules/', '*.config.js'],
};
