module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'import'],
  extends: ['next/core-web-vitals', 'plugin:@typescript-eslint/recommended'],
  rules: {
    'react-hooks/exhaustive-deps': 'off',
    'import/no-unused-modules': 'error', // Enable this rule to catch unused modules
    '@typescript-eslint/no-unused-vars': 'warn',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-non-null-asserted-optional-chain': 'off',
    '@typescript-eslint/no-var-requires': 'warn',
    '@typescript-eslint/ban-ts-comment': 'off',
    '@typescript-eslint/no-namespace': 'off',
    '@typescript-eslint/no-empty-object-type': 'warn',
    // '@typescript-eslint/explicit-module-boundary-types': 'error',
    // '@typescript-eslint/no-misused-promises': 'error',
    // '@typescript-eslint/await-thenable': 'error',
    // 'import/no-relative-parent-imports': ['error', { ignore: ['^@/'] }],
    // 'import/no-relative-imports': 'error',
    // 'import/no-unresolved': 'error',
    // 'import/namespace': 'off',
    // 'import/default': 'off',
    '@next/next/no-img-element': 'off',
  },
  settings: {
    'import/resolver': {
      alias: {
        map: [['@', './']], // Map @ to the base directory
        extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
      },
      typescript: {
        project: './tsconfig.json',
      },
    },
    'import/internal-regex': '^@/',
  },
}
