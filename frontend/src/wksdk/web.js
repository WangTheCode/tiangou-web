/**
 * web端的方法
 */

import { WKSDK, ConnectStatus } from 'wukongimjssdk'
import { useChatStore, useUserStore } from '@/stores/index'
import { messageListener, messageStatusListener } from './chatManager'
import { conversationListener } from './conversationManager'

// 连接websocket
export const connectWebSocket = (options) => {
  return new Promise((resolve, reject) => {
    const { uid, token } = options
    const chatStore = useChatStore()
    const userStore = useUserStore()

    if (!(userStore.imConfig && userStore.imConfig.wss_addr)) {
      reject('未获取到连接地址')
      return
    }

    WKSDK.shared().config.addr = userStore.imConfig.wss_addr
    WKSDK.shared().config.uid = uid
    WKSDK.shared().config.token = token

    WKSDK.shared().connectManager.addConnectStatusListener((status, reasonCode) => {
      if (status === ConnectStatus.Connecting) {
        chatStore.setConnectStatus('loading')
      } else if (status === ConnectStatus.Connected) {
        chatStore.setConnectStatus('success')
        resolve(true)
      } else {
        chatStore.setConnectStatus('error')
        reject(reasonCode)
      }
    })

    WKSDK.shared().chatManager.addMessageListener(messageListener)
    WKSDK.shared().chatManager.addMessageStatusListener(messageStatusListener)
    WKSDK.shared().conversationManager.addConversationListener(conversationListener)
    WKSDK.shared().connectManager.connect()
  })
}
