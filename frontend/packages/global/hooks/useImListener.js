import { ConnectStatus } from 'wukongimjssdk'
import { useChatStore } from '../stores/index'

export const useImListener = () => {
  const chatStore = useChatStore()

  // 监听连接状态
  const connectStatusListener = status => {
    console.log('📨 监听连接状态:' + status)
    if (status === ConnectStatus.Connecting) {
      chatStore.setConnectStatus('loading')
    } else if (status === ConnectStatus.Connected) {
      chatStore.setConnectStatus('success')
    } else {
      chatStore.setConnectStatus('error')
    }
  }

  // 监听消息
  const messageListener = message => {
    console.log('📨 收到消息:' + JSON.stringify(message))
  }

  // 监听消息发送状态
  const messageStatusListener = ack => {
    if (ack.reasonCode === 1) {
      console.log('✅ 消息发送成功')
    } else {
      console.log(`❌ 消息发送失败 (错误码: ${ack.reasonCode})`)
    }
  }

  return {
    connectStatusListener,
    messageListener,
    messageStatusListener,
  }
}
