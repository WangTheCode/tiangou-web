import { createPinia } from 'pinia'
import { useAppStore } from './modules/app'
import { useUserStore } from './modules/user'
import { useChatStore } from './modules/chat'
const pinia = createPinia()

export { useAppStore, useUserStore, useChatStore }
export default pinia
