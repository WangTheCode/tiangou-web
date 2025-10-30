import { defineStore } from 'pinia'
import piniaStore from '..'
import Cache from '@/utils/cache'
import chatApi from '@/api/chat'
import ipcApiRoute from '@/utils/icp/ipcRoute'
import { Convert } from '@/wksdk/dataConvert'
import { WKSDK, MessageStatus, Reply, ChannelTypeGroup } from 'wukongimjssdk'
import { useAppStore } from '@/stores'
import { isEE } from '@/utils/icp/ipcRenderer'
import { connectWebSocket } from '@/wksdk/web'
import { scrollControl } from '@/hooks/useScrollControl'
import {
  syncConversationList,
  setOpenConversation,
  refreshMessages,
} from '@/wksdk/conversationManager'
import { fetchChannelInfoIfNeed, getChannelInfo, newChannel } from '@/wksdk/channelManager'
import { sendMessage } from '@/wksdk/chatManager'
import {
  setChannelInfoCallback,
  setSyncConversationsCallback,
  setSyncSubscribersCallback,
  registerGlobalChannelInfoListener,
} from '@/wksdk/setCallback'
// import { ElMessage } from 'element-plus'

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
    // 当前会话未读消息数，如果大于0，则在离开时请求清空未读
    currentConversationUnread: 0,
    // 当前聊天窗口回复的消息
    replyMessage: null,
    // 是否显示选择消息
    showSelectMessage: false,
    // 当前聊天窗口选中的消息
    selectedMessagesByMessageID: {},
    // 当前会话的成员
    subscribers: [],
    // 是否正在加载历史消息
    isLoadingHistory: false,
    // channelInfo 更新触发器，用于通知组件重新渲染
    channelInfoUpdateTrigger: 0,
  }),
  getters: {},
  actions: {
    connectIm(userInfo) {
      return new Promise((resolve, reject) => {
        this.connectStatus = 'loading'
        this.connectUserInfo = userInfo

        if (isEE) {
          WKSDK.shared().config.uid = userInfo.uid
          WKSDK.shared().config.token = userInfo.token
          ipcApiRoute
            .connectTcp(userInfo)
            .then((res) => {
              resolve(res)
            })
            .catch((err) => {
              reject(err)
            })
        } else {
          // 设置wksdk回调
          setSyncConversationsCallback()
          setChannelInfoCallback()
          setSyncSubscribersCallback()
          // 注册全局 channelInfo 监听器（仅注册一次）
          registerGlobalChannelInfoListener()

          connectWebSocket(userInfo)
            .then((res) => {
              resolve(res)
            })
            .catch((err) => {
              reject(err)
            })
        }
      })

      // const { connect } = useTSDD()
      // connect(userInfo).then(() => {
      //   const { fetchChannelInfoIfNeed } = useWKSDK()
      //   fetchChannelInfoIfNeed(new Channel(userInfo.uid, ChannelTypePerson))
      // })
    },
    setConnectStatus(status) {
      this.connectStatus = status
      if (status === 'success' && this.conversationList.length === 0) {
        syncConversationList().then(() => {
          // console.log('666', res)
          // this.conversationList = res
        })
      }
    },
    // 触发 channelInfo 更新（当 SDK 加载完 channelInfo 后调用）
    triggerChannelInfoUpdate() {
      this.channelInfoUpdateTrigger++
    },
    setConversationList(conversations) {
      this.conversationList = this.sortConversations(conversations)
    },
    setCurrentConversation(conversation) {
      if (
        this.currentConversation &&
        this.currentConversation.channel &&
        this.currentConversation.channel.channelID === conversation.channel.channelID
      ) {
        return
      }
      if (
        this.currentConversationUnread > 0 &&
        this.currentConversation &&
        this.currentConversation.channel
      ) {
        this.markConversationUnread(this.currentConversation.channel, 0)
        this.currentConversationUnread = 0
      }
      console.log('setCurrentConversation----->', conversation)
      this.chatMessagesOfOrigin = []
      this.chatMessages = []
      this.setReplyMessage(null)
      setOpenConversation(conversation)
      this.currentConversation = conversation
      fetchChannelInfoIfNeed(conversation.channel)
      this.syncChannelMessageList(conversation.channel, {
        limit: 30,
        startMessageSeq: 0,
        endMessageSeq: 0,
        pullMode: 0,
      })

      // 群聊
      if (conversation.channel.channelType === ChannelTypeGroup) {
        this.syncSubscribers(conversation).then(() => {
          this.reloadSubscribers(conversation.channel)
        })
      }
    },
    syncSubscribers(conversation) {
      return new Promise((resolve) => {
        console.log(conversation)

        if (conversation.channelInfo.orgData.group_type == 1) {
          // 如果是超级群则只获取第一页成员
          // this.subscribers = await this.getFirstPageMembers()
          WKSDK.shared().channelManager.subscribeCacheMap.set(
            conversation.channel.getChannelKey(),
            this.subscribers,
          )
          WKSDK.shared().channelManager.notifySubscribeChangeListeners(conversation.channel)
          resolve(true)
        } else {
          WKSDK.shared()
            .channelManager.syncSubscribes(conversation.channel)
            .then(() => {
              resolve(true)
            })
        }
      })
    },
    // 重新加载订阅者
    reloadSubscribers(channel) {
      this.subscribers = WKSDK.shared().channelManager.getSubscribes(channel)
    },
    setSendMessageMode(mode) {
      this.sendMessageMode = mode
      Cache.set('sendMessageMode', mode)
    },
    syncChannelMessageList(channel, opts) {
      return new Promise((resolve, reject) => {
        const limit = opts.limit || 30
        chatApi
          .syncChannelMessageList({
            limit: limit,
            channel_id: channel.channelID,
            channel_type: channel.channelType,
            start_message_seq: opts.startMessageSeq || 0,
            end_message_seq: opts.endMessageSeq || 0,
            pull_mode: opts.pullMode,
          })
          .then((resp) => {
            let messages = []
            const messageList = resp && resp['messages']
            if (messageList) {
              messageList.forEach((msg) => {
                if (!msg.is_deleted) {
                  const message = Convert.toMessage(msg)

                  const messageWrap = Convert.toMessageWrap(message)
                  messages.push(messageWrap)
                }
              })
            }
            this.chatMessagesOfOrigin = messages
            this.chatMessages = refreshMessages(messages)
            this.markConversationUnread(channel, 0)
            resolve(messages)
          })
          .catch((err) => {
            reject(err)
          })
      })
    },
    // 加载更多历史消息
    loadMoreMessages(channel, limit = 30) {
      return new Promise((resolve, reject) => {
        // 如果没有消息或正在加载，直接返回
        if (!this.chatMessagesOfOrigin || this.chatMessagesOfOrigin.length === 0) {
          resolve({ messages: [], hasMore: false })
          return
        }

        // 如果已经在加载，不要重复加载
        if (this.isLoadingHistory) {
          resolve({ messages: [], hasMore: false })
          return
        }

        // 获取最早的消息序列号
        const firstMessage = this.chatMessagesOfOrigin[0]
        const startMessageSeq = firstMessage.messageSeq

        if (startMessageSeq <= 0) {
          // 序列号为0或负数，说明没有更多历史消息了
          resolve({ messages: [], hasMore: false })
          return
        }

        // 设置加载标志
        this.isLoadingHistory = true

        chatApi
          .syncChannelMessageList({
            limit: limit,
            channel_id: channel.channelID,
            channel_type: channel.channelType,
            start_message_seq: 0,
            end_message_seq: startMessageSeq,
            pull_mode: 1, // 1表示向下拉取(获取更早的消息)
          })
          .then((resp) => {
            let messages = []
            const messageList = resp && resp['messages']
            if (messageList) {
              messageList.forEach((msg) => {
                if (!msg.is_deleted) {
                  const message = Convert.toMessage(msg)
                  const messageWrap = Convert.toMessageWrap(message)
                  messages.push(messageWrap)
                }
              })
            }

            if (messages.length > 0) {
              // 将新消息添加到数组开头
              this.chatMessagesOfOrigin = [...messages, ...this.chatMessagesOfOrigin]
              this.chatMessages = refreshMessages(this.chatMessagesOfOrigin)
              console.log('loadMoreMessages----->', messages.length, 'new messages loaded')
            }

            // 判断是否还有更多消息
            const hasMore = messages.length >= limit

            // 清除加载标志
            this.isLoadingHistory = false

            resolve({ messages, hasMore })
          })
          .catch((err) => {
            console.error('loadMoreMessages error:', err)
            // 出错时也要清除加载标志
            this.isLoadingHistory = false
            reject(err)
          })
      })
    },
    // 标记会话已读
    markConversationUnread(channel, unread) {
      chatApi
        .clearUnread({
          channel_id: channel.channelID,
          channel_type: channel.channelType,
          unread: unread > 0 ? unread : 0,
        })
        .then(() => {
          this.conversationList = this.conversationList.map((item) => {
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
    addConversation(conversation) {
      this.conversationList.push(conversation)
      console.log('addConversation----->', conversation.channelInfo)
    },
    updateConversation(conversation) {
      const index = this.conversationList.findIndex((item) =>
        item.channel.isEqual(conversation.channel),
      )
      if (index !== -1) {
        // 修改原 Conversation 实例的属性，保留类的所有方法和 getter
        const item = this.conversationList[index]
        item.unread = conversation.unread
        item.lastMessage = conversation.lastMessage
        item.timestamp = conversation.timestamp || item.timestamp
        // 添加更新时间戳，强制触发 Vue 的响应式更新
        item._updateTime = Date.now()
        item.channelInfo.top = conversation.extra.top === 1
        item.channelInfo.mute = conversation.extra.mute === 1

        // 创建新的数组引用以确保触发响应式更新
        // 这样既保留了 Conversation 类实例，又能触发组件的 props 更新
        this.conversationList = [...this.conversationList]
      }
      console.log('updateConversation----->', this.conversationList)
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
      console.log('sortConversations----->', sortAfter)
      return sortAfter
    },
    removeConversation(conversation) {
      this.conversationList = this.conversationList.filter(
        (item) => !item.channel.isEqual(conversation.channel),
      )
    },
    tipsAudio() {
      const appStore = useAppStore()
      appStore.setPlayAudioUrl('')
      setTimeout(() => {
        appStore.setPlayAudioUrl('/audio/msg-tip.mp3')
      }, 10)
    },
    sendNotification(message, description) {
      let channelInfo = getChannelInfo(message.channel)
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
    },
    appendMessage(messageWrap) {
      // const senderIsSelf = messageWrap.fromUID === this.connectUserInfo.uid
      this.chatMessagesOfOrigin.push(messageWrap)
      this.chatMessages = refreshMessages(this.chatMessagesOfOrigin)
      this.currentConversationUnread++
      if (messageWrap.message.send) {
        // 如果是发送的消息，则强制滚动到消息底部
        scrollControl.scrollTo('chat-message-list', true)
      } else {
        scrollControl.scrollTo('chat-message-list', false)
      }
    },
    sendMessage(data) {
      return new Promise((resolve, reject) => {
        // const { sendMessage } = useTSDD()
        // console.log('chatStore sendMessage----->', data)
        // const message = await sendMessage(data)
        // console.log('sendMessage----->', message)
        if (this.replyMessage) {
          const reply = new Reply()
          reply.messageID = this.replyMessage.messageID
          reply.messageSeq = this.replyMessage.messageSeq
          reply.fromUID = this.replyMessage.fromUID
          const channelInfo = getChannelInfo(newChannel(this.replyMessage.fromUID))
          if (channelInfo) {
            reply.fromName = channelInfo.title
          }
          reply.content = this.replyMessage.content
          data.reply = reply
        }

        if (!this.currentConversation) {
          reject(new Error('当前会话不存在'))
          return
        }
        if (isEE) {
          if (!data.channel) {
            data.channel = this.currentConversation.channel
          }
          data.content = { ...data.content, contentType: data.content.contentType }
          ipcApiRoute.sendMessage(data).then((res) => {
            console.log('tcp sendMessage----->', res)
            resolve(res)
          })
        } else {
          let channel = this.currentConversation.channel
          if (data.channel) {
            channel = data.channel
          }
          sendMessage(channel, data).then((message) => {
            this.setReplyMessage(null)
            resolve(message)
          })
        }
      })
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
        (item) => item.clientSeq !== clientSeq,
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
    updateMessageStatus(ackPacket) {
      if (!this.chatMessagesOfOrigin || this.chatMessagesOfOrigin.length <= 0) {
        return
      }
      // 更新
      for (let i = this.chatMessagesOfOrigin.length - 1; i >= 0; i--) {
        const message = this.chatMessagesOfOrigin[i]
        if (message.clientSeq === ackPacket.clientSeq) {
          message.message.messageID = ackPacket.messageID.toString()
          message.message.messageSeq = ackPacket.messageSeq
          if (ackPacket.reasonCode === 1) {
            message.status = MessageStatus.Normal
          } else {
            message.status = MessageStatus.Fail
          }
        }
      }
    },
    getMessageMax() {},
    setReplyMessage(message) {
      this.replyMessage = message
    },
    addSelectedMessage(message) {
      this.showSelectMessage = true
      this.selectedMessagesByMessageID[message.messageID] = message
    },
    removeSelectedMessage(message) {
      delete this.selectedMessagesByMessageID[message.messageID]
    },
    clearSelectedMessages() {
      this.selectedMessagesByMessageID = {}
      this.showSelectMessage = false
    },
    // 获取选中的消息列表
    getSelectedMessages() {
      return Object.values(this.selectedMessagesByMessageID)
    },
    // 删除消息
    async deleteMessages(messages) {
      if (!messages || messages.length === 0) {
        return
      }

      const params = messages.map((msg) => ({
        message_id: msg.messageID,
        channel_id: msg.channel.channelID,
        channel_type: msg.channel.channelType,
        message_seq: msg.messageSeq,
      }))

      try {
        await chatApi.deleteMessages(params)

        // 从本地消息列表中删除
        this.chatMessagesOfOrigin = this.chatMessagesOfOrigin.filter((msg) => {
          return !messages.some((delMsg) => delMsg.clientMsgNo === msg.clientMsgNo)
        })
        this.chatMessages = refreshMessages(this.chatMessagesOfOrigin)

        // 清空选中状态
        this.clearSelectedMessages()
        console.log('删除消息成功')
      } catch (err) {
        console.error('删除消息失败:', err)
        throw err
      }
    },
    // 转发消息 - 显示会话选择器
    forwardMessages(messages, callback) {
      // 这里需要调用会话选择器组件
      // 暂时通过 callback 返回选中的会话列表
      if (callback) {
        callback(messages)
      }
    },
    // 逐条转发消息到指定会话
    async forwardMessagesToChannels(messages, channels) {
      if (!messages || messages.length === 0 || !channels || channels.length === 0) {
        return
      }

      const promises = []
      for (const channel of channels) {
        for (const message of messages) {
          // 复制消息内容并发送到新的会话
          const content = message.content
          promises.push(this.sendMessage({ text: content.text || '', channel }))
        }
      }

      try {
        await Promise.all(promises)
        this.clearSelectedMessages()
        console.log('转发消息成功')
      } catch (err) {
        console.error('转发消息失败:', err)
        throw err
      }
    },
    // 合并转发消息到指定会话
    async mergeForwardMessages(messages, channels) {
      if (!messages || messages.length === 0 || !channels || channels.length === 0) {
        return
      }

      // TODO: 实现合并转发逻辑
      // 需要创建合并转发的消息内容类型
      console.log('合并转发功能待实现')
      this.clearSelectedMessages()
    },
  },
})

export function useChatOutsideStore() {
  return useChatStore(piniaStore)
}
