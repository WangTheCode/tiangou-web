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
    chatMessagesOfOrigin: [],
    // 当前对话是否需要设置未读
    // needSetUnread: false,
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
          // console.log('666', res)
          // this.conversationList = res
        })
      }
    },
    setConversationList(conversations) {
      this.conversationList = conversations
    },
    setCurrentConversation(conversation) {
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

    findConversation(channel) {
      if (this.conversationList) {
        for (const conversation of this.conversationList) {
          if (conversation.channel.isEqual(channel)) {
            return conversation
          }
        }
      }
    },

    updateConversation(conversation) {
      console.log('updateConversation----->', this.conversationList, conversation)
      this.conversationList = this.conversationList.map(item => {
        if (item.channel.isEqual(conversation.channel)) {
          item.unread = conversation.unread
          item.lastMessage = conversation.lastMessage
          // return { ...item, unread: conversation.unread, lastMessage: conversation.lastMessage }
        }
        return item
      })
    },
    sortConversations(conversations) {
      let newConversations = conversations
      if (!newConversations) {
        newConversations = this.conversationList
      }
      if (!newConversations || newConversations.length <= 0) {
        return []
      }
      let sortAfter = newConversations.sort((a, b) => {
        let aScore = a.timestamp
        let bScore = b.timestamp
        if (a.extra?.top === 1) {
          aScore += 1000000000000
        }
        if (b.extra?.top === 1) {
          bScore += 1000000000000
        }
        return bScore - aScore
      })
      return sortAfter
    },
    // setNeedSetUnread(needSetUnread) {
    //   this.needSetUnread = needSetUnread
    // },
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
