/**
 * 用于监听http请求electron服务的消息
 */

import { ipc } from './ipcRenderer'
import { useChatStore } from '@/stores/index'
import { ConnectStatus, Channel, Message } from 'wukongimjssdk'
import { handleSyncConversations } from '@/wksdk/setCallback'
import { messageListener, messageStatusListener } from '@/wksdk/chatManager'
import { newChannel } from '@/wksdk/channelManager'
import { conversationListener } from '@/wksdk/conversationManager'

// const userStore = useUserStore()
export const URLS = {
  onConnectStatus: 'controller.web.onConnectStatus',
  onAddMessageListener: 'controller.web.addMessageListener',
  onAddConversationListener: 'controller.web.addConversationListener',
  onSyncConversationList: 'controller.web.syncConversationList',
  onAddMessageStatusListener: 'controller.web.addMessageStatusListener',
}

export default class ipcListener {
  static init = () => {
    this.onConnectStatus()
    this.onAddMessageListener()
    this.onAddConversationListener()
    this.onSyncConversationList()
    this.onAddMessageStatusListener()
  }
  static onConnectStatus = () => {
    const chatStore = useChatStore()
    ipc.removeAllListeners(URLS.onConnectStatus)
    ipc.on(URLS.onConnectStatus, (_e, result) => {
      const { status, reasonCode } = result
      if (status === ConnectStatus.Connecting) {
        chatStore.setConnectStatus('loading')
      } else if (status === ConnectStatus.Connected) {
        chatStore.setConnectStatus('success')
      } else {
        chatStore.setConnectStatus('error')
      }
    })
  }
  static onAddMessageListener = () => {
    ipc.removeAllListeners(URLS.onAddMessageListener)
    ipc.on(URLS.onAddMessageListener, (_e, result) => {
      console.log('📨 tcp收到消息:', result)
      result.channel = newChannel(result.channel.channelID, result.channel.channelType)
      const message = new Message()
      message.channel = newChannel(result.channel.channelID, result.channel.channelType)
      message.messageID = result.message.messageID
      message.messageSeq = result.message.messageSeq
      message.clientSeq = result.message.clientSeq
      message.clientMsgNo = result.message.clientMsgNo

      // 还需处理类型
      message.content = result.message.content
      message.header = result.message.header
      message.remoteExtra = result.message.remoteExtra
      message.setting = result.message.setting

      message.fromUID = result.message.fromUID
      message.isDeleted = result.message.isDeleted

      message.timestamp = result.message.timestamp
      message.status = result.message.status
      message.voicePlaying = result.message.voicePlaying
      message.voiceReaded = result.message.voiceReaded
      // result.message.contentType = result.message.contentType
      messageListener(result)
    })
  }
  static onAddConversationListener = () => {
    ipc.removeAllListeners(URLS.onAddConversationListener)
    ipc.on(URLS.onAddConversationListener, (_e, result) => {
      console.log('📨 tcp收到会话:', result)
      if (result.conversation.channel) {
        result.conversation.channel = new Channel(
          result.conversation.channel.channelID,
          result.conversation.channel.channelType,
        )
      }
      conversationListener(result.conversation, result.action)
    })
  }
  static onSyncConversationList = () => {
    ipc.removeAllListeners(URLS.onSyncConversationList)
    ipc.on(URLS.onSyncConversationList, (_e, result) => {
      const conversations = handleSyncConversations(result)
      const chatStore = useChatStore()
      chatStore.setConversationList(conversations)
      console.log('📨 tcp收到会话列表:', conversations)
    })
  }
  static onAddMessageStatusListener = () => {
    ipc.removeAllListeners(URLS.onAddMessageStatusListener)
    ipc.on(URLS.onAddMessageStatusListener, (_e, result) => {
      console.log('📨 tcp收到消息状态:', result)
      messageStatusListener(result)
    })
  }
}
