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
      // 放宽少量规则，交由 Prettier 处理风格
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      // 显式关闭与 Prettier 冲突且导致“跳动/黄色波浪线”的 vue 规则
      'vue/max-attributes-per-line': 'off',
      'vue/first-attribute-linebreak': 'off',
      'vue/singleline-html-element-content-newline': 'off',
      'vue/multiline-html-element-content-newline': 'off',
      'vue/html-self-closing': 'off',
    },
  },
  // 关闭与 Prettier 冲突的所有风格类规则（含 vue 插件）
  eslintConfigPrettier,
]
