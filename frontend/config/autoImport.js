/**
 * @name AutoImportDeps
 * @description 按需加载，自动引入
 */
import AutoImport from 'unplugin-auto-import/vite'

export const AutoImportDeps = () => {
  return AutoImport({
    imports: [
      'vue',
      'pinia',
      'vue-router',
      {
        '@vueuse/core': [
          'useStorage',
          'useLocalStorage',
          'useSessionStorage',
          'useDark',
          'useToggle',
          'useClipboard',
          'useEventListener',
          'useWindowSize',
          'useResizeObserver',
          'useIntersectionObserver',
          'useMutationObserver',
          'useWebSocket',
          'useNow',
          'useTimestamp',
          'useInterval',
          'useTimeout',
          'useDebounce',
          'useThrottle'
        ],
      },
    ],
  })
}
