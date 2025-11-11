import { ref } from 'vue'

export function useScrollToMessage() {
  const scrollHandlers = ref(new Map())

  const registerScrollHandler = (componentId, handler) => {
    scrollHandlers.value.set(componentId, handler)
  }

  const unregisterScrollHandler = (componentId) => {
    scrollHandlers.value.delete(componentId)
  }

  const scrollTo = (componentId, position) => {
    const handler = scrollHandlers.value.get(componentId)
    if (handler) {
      handler(position)
    }
  }

  return {
    registerScrollHandler,
    unregisterScrollHandler,
    scrollTo,
  }
}

// 创建全局实例
export const scrollToMessage = useScrollToMessage()
