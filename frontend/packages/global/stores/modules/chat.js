import { defineStore } from 'pinia'
import piniaStore from '../counter'
import Cache from '../../utils/cache'
import { useTSDD } from '../../hooks/useTSDD'
import tsddApi from '../../api/tsdd'
import ipcApiRoute from '../../icp/ipcRoute'
import { Convert } from '../../tsdd/Convert'
import { Conversation } from '../../tsdd/Conversation'
import { useWKSDK } from '../../hooks/useWKSDK'
import { WKSDK, Channel, ChannelTypePerson, MessageText, Mention, Setting } from 'wukongimjssdk'
import { avatarChannel } from '@global/tsdd/index'
import { useAppOutsideStore } from '@global/stores/modules/app'
import { MessageWrap } from '../../tsdd/Model'

export const useChatStore = defineStore('chat', {
  state: () => ({
    connectUserInfo: null,
    // 通信连接状态
    connectStatus: 'loading', // loading, success, error
    conversationList: [],
    currentConversation: null,
    sendMessageMode: 'enter',
    chatMessages: [],
    chatMessagesOfOrigin: [],
    // 当前对话是否需要设置未读
    // needSetUnread: false,
    // 用户设置是否显示消息通知,1=通知,0=不通知
    isMessageNotification: 1,
    sendMessageQueue: {},
  }),
  getters: {},
  actions: {
    connect(userInfo) {
      this.connectStatus = 'loading'
      this.connectUserInfo = userInfo
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
      WKSDK.shared().conversationManager.openConversation = conversation
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
          this.chatMessagesOfOrigin = messages
          this.chatMessages = conversation.refreshMessages(messages)
          this.markConversationUnread(channel, 0)
        })
    },
    // 标记会话已读
    markConversationUnread(channel, unread) {
      tsddApi
        .clearUnread({
          channel_id: channel.channelID,
          channel_type: channel.channelType,
          unread: unread > 0 ? unread : 0,
        })
        .then(() => {
          this.conversationList = this.conversationList.map(item => {
            if (item.channel.isEqual(channel)) {
              item.unread = unread > 0 ? unread : 0
            }
            return item
          })
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
    tipsAudio() {
      const appStore = useAppOutsideStore()
      appStore.setPlayAudioUrl('')
      setTimeout(() => {
        appStore.setPlayAudioUrl('/audio/msg-tip.mp3')
      }, 10)
    },
    sendNotification(message, description) {
      let channelInfo = WKSDK.shared().channelManager.getChannelInfo(message.channel)
      if (channelInfo && channelInfo.mute) {
        return
      }
      if (this.isMessageNotification === 0) {
        // 用户设置不显示消息通知
        return
      }
      if (!message.header.reddot) {
        // 不显示红点的消息不发通知
        return
      }
      if (description == undefined || description === '') {
        return
      }
      if (message.header.noPersist) {
        return
      }
      if (WKSDK.shared().isSystemMessage(message.contentType)) {
        // 系统消息不发通知
        return
      }
      if (message.fromUID === this.connectUserInfo.uid) {
        // 自己发的消息不发通知
        return
      }
      this.tipsAudio()
      console.log('sendNotification----->', message, description)
      // if (window.Notification && Notification.permission !== 'denied') {
      //   if (this.messageNotification) {
      //     if (this.messageNotificationTimeoutId) {
      //       clearTimeout(this.messageNotificationTimeoutId)
      //     }
      //     this.messageNotification.close()
      //   }

      //   this.messageNotification = new Notification(
      //     channelInfo ? channelInfo.orgData.displayName : '通知',
      //     {
      //       body: description,
      //       icon: avatarChannel(message.channel),
      //       lang: 'zh-CN',
      //       tag: 'message',
      //       // renotify: true,
      //     }
      //   )

      //   this.messageNotification.onclick = () => {
      //     this.messageNotification?.close()
      //     window.focus()
      //     // TODO: 打开会话
      //     console.log('TODO: 打开会话')

      //     // WKApp.endpoints.showConversation(message.channel)
      //   }
      //   this.messageNotification.onshow = () => {
      //     console.log('显示通知')
      //   }
      //   this.messageNotification.onclose = () => {
      //     console.log('通知关闭')
      //   }
      //   // 5秒后关闭消息框
      //   const self = this
      //   this.messageNotificationTimeoutId = window.setTimeout(function () {
      //     self.messageNotification?.close()
      //   }, 5000)
      // }
    },
    appendMessage(messageWrap) {
      // const senderIsSelf = messageWrap.fromUID === this.connectUserInfo.uid
      this.chatMessagesOfOrigin.push(messageWrap)
      const conversation = new Conversation()
      this.chatMessages = conversation.refreshMessages(this.chatMessagesOfOrigin)
    },
    async sendMessage(data) {
      const { sendMessage } = useTSDD()
      console.log('chatStore sendMessage----->', data)
      // const message = await WKSDK.shared().chatManager.send(content, channel, setting)
      const message = await sendMessage(data)
      console.log('sendMessage----->', message)
      // const messageWrap = new MessageWrap(message)
      // this.addSendMessageToQueue(messageWrap)
    },
    // 添加消息到发送队列
    addSendMessageToQueue(messageWrap) {
      const channelKey = messageWrap.channel.getChannelKey()
      if (this.sendMessageQueue[channelKey]) {
        this.sendMessageQueue[channelKey].push(messageWrap)
        return
      }
      this.sendMessageQueue[channelKey] = [messageWrap]
    },
    // 获取发送队列
    getSendMessageQueue(channelKey) {
      return this.sendMessageQueue[channelKey]
    },
    // 删除消息从发送队列
    removeSendMessageFromQueue(clientSeq, channel) {
      const channelKey = channel.getChannelKey()
      this.sendMessageQueue[channelKey] = this.sendMessageQueue[channelKey].filter(
        item => item.clientSeq !== clientSeq
      )
    },
    // 通过clientSeq获取消息对象
    findMessageWithClientSeq(clientSeq) {
      if (!this.chatMessagesOfOrigin || this.chatMessagesOfOrigin.length <= 0) {
        return
      }
      for (let i = this.chatMessagesOfOrigin.length - 1; i >= 0; i--) {
        const message = this.chatMessagesOfOrigin[i]
        if (message.clientSeq === clientSeq) {
          return message
        }
      }
    },
  },
})

export function useChatOutsideStore() {
  return useChatStore(piniaStore)
}
