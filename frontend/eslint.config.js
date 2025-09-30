import js from '@eslint/js'
import pluginVue from 'eslint-plugin-vue'
import globals from 'globals'
import eslintConfigPrettier from 'eslint-config-prettier'

/** @type {import('eslint').Linter.FlatConfig[]} */
export default [
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/*.min.*',
      '**/packages/**/crash-h5/**',
      '**/packages/**/double-h5/**',
    ],
  },
  js.configs.recommended,
  ...pluginVue.configs['flat/recommended'],
  {
    files: ['**/*.{js,vue}', '**/*.mjs'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.es2021,
      },
    },
    rules: {
      // 代码质量规则
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-console': 'warn',

      // 代码长度限制
      'max-len': [
        'warn',
        {
          code: 120,
          ignoreStrings: true,
          ignoreTemplateLiterals: true,
          ignoreRegExpLiterals: true,
          ignoreUrls: true,
          ignoreComments: true,
        },
      ],

      // Vue 规则 - 关闭与 Prettier 冲突的规则
      'vue/max-attributes-per-line': 'off',
      'vue/first-attribute-linebreak': 'off',
      'vue/singleline-html-element-content-newline': 'off',
      'vue/multiline-html-element-content-newline': 'off',
      'vue/html-self-closing': 'off',
      'vue/html-indent': 'off',
      'vue/html-closing-bracket-newline': 'off',

      // Vue 最佳实践
      'vue/multi-word-component-names': 'warn',
      'vue/no-unused-vars': 'warn',
      'vue/require-default-prop': 'off',
      'vue/require-explicit-emits': 'off',
    },
  },
  // 关闭与 Prettier 冲突的所有风格类规则（含 vue 插件）
  eslintConfigPrettier,
]
