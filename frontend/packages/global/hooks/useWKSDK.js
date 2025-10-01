import { ref } from 'vue'
import WKSDK, { ConnectStatus } from 'wukongimjssdk'
import { useChatStore } from '../stores/index'
export const useWKSDK = () => {
  const chatStore = useChatStore()
  const connectWebSocket = options => {
    return new Promise((resolve, reject) => {
      const { uid, token } = options
      // WKSDK.shared().config.addr = 'wss://tgdd-ws.jx3kaihe.top'; // 默认端口为5200
      WKSDK.shared().config.addr = import.meta.env.VITE_WS_HOST
      // 认证信息
      WKSDK.shared().config.uid = uid // 用户uid（需要在悟空通讯端注册过）
      WKSDK.shared().config.token = token // 用户token （需要在悟空通讯端注册过）

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

      WKSDK.shared().chatManager.addMessageListener(message => {
        console.log('📨 收到消息:' + JSON.stringify(message))
      })

      // 监听消息发送状态
      WKSDK.shared().chatManager.addMessageStatusListener(ack => {
        if (ack.reasonCode === 1) {
          console.log('✅ 消息发送成功')
        } else {
          console.log(`❌ 消息发送失败 (错误码: ${ack.reasonCode})`)
        }
      })

      WKSDK.shared().config.provider.syncConversationsCallback = async filter => {
        return filter
      }

      WKSDK.shared().connectManager.connect()
    })
  }

  return {
    connectWebSocket,
  }
}
