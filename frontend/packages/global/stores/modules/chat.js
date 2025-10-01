import { defineStore } from 'pinia'
import piniaStore from '../counter'
import Cache from '../../utils/cache'
import { useTSDD } from '../../hooks/useTSDD'
import tsddApi from '../../api/tsdd'
import ipcApiRoute from '../../icp/ipcRoute'
import { Convert } from '../tsdd/Convert'

export const useChatStore = defineStore('chat', {
  state: () => ({
    // 通信连接状态
    connectStatus: 'loading', // loading, success, error
    conversationList: [],
    currentConversation: null,
    sendMessageMode: 'enter',
    chatMessages: [],
  }),
  getters: {},
  actions: {
    connect(userInfo) {
      this.connectStatus = 'loading'
      const { connect } = useTSDD()
      connect(userInfo)
    },
    setConnectStatus(status) {
      this.connectStatus = status
      if (status === 'success' && this.conversationList.length === 0) {
        const { syncConversationList } = useTSDD()
        syncConversationList().then(res => {
          this.conversationList = res
        })
      }
    },
    setCurrentConversation(conversation) {
      if (
        this.currentConversation &&
        this.currentConversation.channelID === conversation.channelID
      ) {
        return
      }
      this.currentConversation = conversation
      this.syncChannelMessageList(conversation, {
        limit: 30,
        startMessageSeq: 0,
        endMessageSeq: 0,
        pullMode: 0,
      })
    },
    setSendMessageMode(mode) {
      this.sendMessageMode = mode
      Cache.set('sendMessageMode', mode)
    },
    syncChannelMessageList(channel, opts) {
      const limit = opts.limit || 15
      tsddApi
        .syncChannelMessageList({
          limit: limit,
          channel_id: channel.channelID,
          channel_type: channel.channelType,
          start_message_seq: opts.startMessageSeq || 0,
          end_message_seq: opts.endMessageSeq || 0,
          pull_mode: opts.pullMode,
        })
        .then(resp => {
          let messages = []
          const messageList = resp && resp['messages']
          if (messageList) {
            messageList.forEach(msg => {
              const message = Convert.toMessage(msg)
              messages.push(message)
            })
          }
          this.chatMessages = messages
        })
    },
    // syncConversationList() {
    //   ipcApiRoute.syncConversationList().then((res) => {
    //     console.log(res)
    //     this.conversationList = res
    //   })
    // }
  },
})

export function useChatOutsideStore() {
  return useChatStore(piniaStore)
}
