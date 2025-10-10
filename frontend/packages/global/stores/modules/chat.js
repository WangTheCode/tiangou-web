import { defineStore } from 'pinia'
import piniaStore from '../counter'
import Cache from '../../utils/cache'
import { useTSDD } from '../../hooks/useTSDD'
import tsddApi from '../../api/tsdd'
import ipcApiRoute from '../../icp/ipcRoute'
import { Convert } from '../../tsdd/Convert'
import { Conversation } from '../../tsdd/Conversation'
import { useWKSDK } from '../../hooks/useWKSDK'
import { Channel, ChannelTypePerson } from 'wukongimjssdk'

export const useChatStore = defineStore('chat', {
  state: () => ({
    // 通信连接状态
    connectStatus: 'loading', // loading, success, error
    conversationList: [],
    currentConversation: null,
    sendMessageMode: 'enter',
    chatMessagesByChannelId: {},
  }),
  getters: {},
  actions: {
    connect(userInfo) {
      this.connectStatus = 'loading'
      const { connect } = useTSDD()
      connect(userInfo).then(() => {
        const { fetchChannelInfoIfNeed } = useWKSDK()
        fetchChannelInfoIfNeed(new Channel(userInfo.uid, ChannelTypePerson))
      })
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
      console.log(conversation)

      if (
        this.currentConversation &&
        this.currentConversation.channel &&
        this.currentConversation.channel.channelID === conversation.channel.channelID
      ) {
        return
      }
      const { fetchChannelInfoIfNeed } = useWKSDK()
      this.currentConversation = conversation
      fetchChannelInfoIfNeed(conversation.channel)
      this.syncChannelMessageList(conversation.channel, {
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
              const messageWrap = Convert.toMessageWrap(message)
              messages.push(messageWrap)
            })
          }

          const conversation = new Conversation()
          this.chatMessagesByChannelId[channel.channelID] = conversation.refreshMessages(messages)
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
