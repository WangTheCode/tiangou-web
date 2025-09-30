const js = require('@eslint/js')
const globals = require('globals')

/** @type {import('eslint').Linter.FlatConfig[]} */
module.exports = [
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/out/**',
      '**/build/**',
      '**/public/dist/**',
      '**/public/electron/**',
      '**/*.min.*',
      '**/data/**',
      '**/logs/**',
      'frontend/**', // frontend 有自己的配置
    ],
  },
  js.configs.recommended,
  {
    files: ['**/*.js', '**/*.cjs', '**/*.mjs'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'commonjs',
      globals: {
        ...globals.node,
        ...globals.es2021,
      },
    },
    rules: {
      // 代码质量规则
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-console': 'off', // Electron 开发中允许使用 console
      'no-debugger': 'warn',

      // 代码风格规则（与 Prettier 兼容）
      semi: ['error', 'never'],
      quotes: ['error', 'single', { avoidEscape: true }],
      'comma-dangle': ['error', 'always-multiline'],
    },
  },
  {
    // electron 目录特殊配置
    files: ['electron/**/*.js'],
    rules: {
      'no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          args: 'after-used',
        },
      ],
    },
  },
]
