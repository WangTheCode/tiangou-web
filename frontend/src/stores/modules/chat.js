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
import { MessageContentTypeConst } from '@/wksdk/const'
import { conversationPicker } from '@/components/chat/conversationPicker/index'
import { MergeforwardContent } from '@/wksdk/model'
import { sortListByField } from '@/utils/helper'
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
    // 缓存已打开的频道首屏消息
    cacheChatMessagesByChannelID: {},
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

        setSyncSubscribersCallback()
        setChannelInfoCallback()

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
    },
    setConnectStatus(status) {
      this.connectStatus = status
      if (status === 'success' && this.conversationList.length === 0) {
        syncConversationList()
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
      this.chatMessagesOfOrigin = []
      this.chatMessages = []
      this.setReplyMessage(null)
      this.currentConversation = conversation
      setOpenConversation(conversation)
      fetchChannelInfoIfNeed(conversation.channel)
      this.getChannelFirstMessageList(conversation.channel, {
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
      } else {
        this.subscribers = []
      }
    },
    syncSubscribers(conversation) {
      return new Promise((resolve) => {
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
    // 获取缓存的首屏消息
    getCacheChatMessages(channel) {
      const key = `${channel.channelID}_${channel.channelType}`
      const lastMessageID =
        this.currentConversation &&
        this.currentConversation.lastMessage &&
        this.currentConversation.lastMessage.messageID
          ? this.currentConversation.lastMessage.messageID
          : ''
      const cacheMessages = this.cacheChatMessagesByChannelID[key]
      if (cacheMessages && cacheMessages.length > 0) {
        const lastMessage = cacheMessages[0]
        const isCacheValid = lastMessage.messageID === lastMessageID
        if (isCacheValid) {
          return cacheMessages
        }
      }
      return []
    },
    // 添加消息到首屏消息缓存
    addCacheChatMessages(message) {
      const key = `${message.channel.channelID}_${message.channel.channelType}`
      const messages = this.cacheChatMessagesByChannelID[key]
      if (messages && messages.length > 0) {
        messages.push(message)
        if (messages.length > 30) {
          messages.shift()
        }
        this.cacheChatMessagesByChannelID[key] = messages
      }
    },
    // 获取频道首屏消息
    getChannelFirstMessageList(channel, opts) {
      return new Promise((resolve, reject) => {
        const limit = opts.limit || 30
        const params = {
          limit: limit,
          channel_id: channel.channelID,
          channel_type: channel.channelType,
          start_message_seq: opts.startMessageSeq || 0,
          end_message_seq: opts.endMessageSeq || 0,
          pull_mode: opts.pullMode,
        }
        const isInitialLoad = params.start_message_seq === 0 && params.end_message_seq === 0
        if (isInitialLoad) {
          const cacheMessages = this.getCacheChatMessages(channel)
          if (cacheMessages && cacheMessages.length > 0) {
            this.chatMessagesOfOrigin = cacheMessages
            this.chatMessages = refreshMessages(cacheMessages)
            resolve(cacheMessages)
            return
          }
        }
        this.fetchChannelMessageList(params)
          .then((messages) => {
            const isInitialLoad = params.start_message_seq === 0 && params.end_message_seq === 0
            if (messages && messages.length > 0 && isInitialLoad) {
              const key = `${channel.channelID}_${channel.channelType}`
              this.cacheChatMessagesByChannelID[key] = messages
            }
            const sendingMessages = this.getQueueSendMessages(
              this.currentConversation.channel.getChannelKey(),
            )
            if (sendingMessages && sendingMessages.length > 0) {
              messages = [...messages, ...sendingMessages]
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
    async fetchChannelMessageList(params) {
      try {
        let resp = ''
        if (isEE) {
          params.lastMessageSeq = this.currentConversation?.lastMessage?.messageSeq || 0
          params.lastMessageID = this.currentConversation?.lastMessage?.messageID || ''
          resp = await ipcApiRoute.syncChannelMessageList(params)
        } else {
          resp = chatApi.syncChannelMessageList(params)
        }

        let messages = []
        const messageList = resp && resp.data && resp.data['messages']
        if (messageList) {
          messageList.forEach((msg) => {
            if (!msg.is_deleted) {
              const message = Convert.toMessage(msg)
              const messageWrap = Convert.toMessageWrap(message)
              messages.push(messageWrap)
            }
          })
        }

        return Promise.resolve(messages)
      } catch (error) {
        return Promise.reject(error)
      }
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
        const params = {
          limit: limit,
          channel_id: channel.channelID,
          channel_type: channel.channelType,
          start_message_seq: 0,
          end_message_seq: startMessageSeq,
          pull_mode: 1, // 1表示向下拉取(获取更早的消息)
        }

        this.fetchChannelMessageList(params)
          .then((messages) => {
            if (messages.length > 0) {
              // 将新消息添加到数组开头
              this.chatMessagesOfOrigin = [...messages, ...this.chatMessagesOfOrigin]
              this.chatMessages = refreshMessages(this.chatMessagesOfOrigin)
            }
            // 判断是否还有更多消息
            const hasMore = messages.length >= limit
            // 清除加载标志
            this.isLoadingHistory = false
            resolve({ messages, hasMore })
          })
          .catch((err) => {
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
    },
    updateConversation(conversation) {
      const index = this.conversationList.findIndex((item) =>
        item.channel.isEqual(conversation.channel),
      )
      if (index !== -1) {
        // 修改原 Conversation 实例的属性，保留类的所有方法和 getter
        const item = this.conversationList[index]
        if (
          this.currentConversation &&
          this.currentConversation.channel.isEqual(conversation.channel)
        ) {
          // 记录当前会话的未读数，用于在离开时请求清空未读
          this.currentConversationUnread = conversation.unread
        } else {
          item.unread = conversation.unread
        }
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
    removeConversation(conversation) {
      this.conversationList = this.conversationList.filter(
        (item) => !item.channel.isEqual(conversation.channel),
      )
    },
    // 清空频道消息
    clearChannelMessages(conversation) {
      if (
        this.currentConversation &&
        this.currentConversation.channel.isEqual(conversation.channel)
      ) {
        this.chatMessagesOfOrigin = []
        this.chatMessages = []
        this.currentConversationUnread = 0
        this.currentConversation.lastMessage = null
      }
      const cacheKey = `${conversation.channel.channelID}_${conversation.channel.channelType}`
      this.cacheChatMessagesByChannelID[cacheKey] = []
      this.conversationList = this.conversationList.map((item) => {
        if (item.channel.isEqual(conversation.channel)) {
          item.lastMessage = null
        }
        return item
      })
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
      if (
        messageWrap.contentType == MessageContentTypeConst.image &&
        messageWrap.message &&
        messageWrap.message.content &&
        messageWrap.message.content.uploadKey &&
        messageWrap.message.content.url
      ) {
        const messageIndex = this.chatMessagesOfOrigin.findIndex((item) => {
          if (
            item.contentType == MessageContentTypeConst.image &&
            item.message &&
            item.message.content &&
            item.message.content.uploadKey === messageWrap.message.content.uploadKey
          ) {
            return true
          }
          return false
        })
        if (messageIndex !== -1) {
          messageWrap.clientMsgNo = this.chatMessagesOfOrigin[messageIndex].clientMsgNo
          this.chatMessagesOfOrigin[messageIndex] = messageWrap
        }
      } else {
        this.chatMessagesOfOrigin.push(messageWrap)
      }

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
        if (!this.currentConversation) {
          reject(new Error('当前会话不存在'))
          return
        }
        // 处理回复
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
        if (!data.channel) {
          data.channel = this.currentConversation.channel
        }
        console.log('sendMessage----->', data)

        if (isEE) {
          // 序列化 channel 对象（只保留可序列化字段）
          const serializedChannel = {
            channelID: data.channel.channelID,
            channelType: data.channel.channelType,
          }

          // 序列化 reply 对象（如果存在）
          let serializedReply = null
          if (data.reply) {
            serializedReply = {
              messageID: data.reply.messageID,
              messageSeq: data.reply.messageSeq,
              fromUID: data.reply.fromUID,
              fromName: data.reply.fromName,
              content: data.reply.content,
            }
          }

          // 序列化 content 对象
          let serializedContent
          if (data.content && data.content.contentType === MessageContentTypeConst.image) {
            serializedContent = {
              ...data.content,
              contentType: data.content.contentType,
              imgData: '',
              url: data.content.url,
              remoteUrl: data.content.remoteUrl,
            }
          } else {
            serializedContent = { ...data.content, contentType: data.content.contentType }
          }

          // 构建完全可序列化的 IPC 数据
          const ipcData = {
            content: serializedContent,
            channel: serializedChannel,
            reply: serializedReply,
            mention: data.mention, // mention 是普通对象，可以直接传递
          }
          ipcApiRoute.sendMessage(ipcData).then((res) => {
            console.log(res.data)
            const message = Convert.toMessageFromIpc(res.data)
            const messageWrap = Convert.toMessageWrap(message)
            console.log(messageWrap)
            this.addSendMessageToQueue(messageWrap)
            this.setReplyMessage(null)
            resolve(messageWrap)
          })
        } else {
          // let channel = this.currentConversation.channel
          // if (data.channel) {
          //   channel = data.channel
          // }
          sendMessage(data.channel, data).then((message) => {
            this.setReplyMessage(null)
            const messageWrap = Convert.toMessageWrap(message)
            this.addSendMessageToQueue(messageWrap)
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
    getQueueSendMessages(channelKey) {
      let sendingMessages = this.sendMessageQueue[channelKey]
      // 检查时间，如果大于指定时间未发送的消息直接删掉,因为没意义了
      if (sendingMessages && sendingMessages.length > 0) {
        const now = Math.floor(new Date().getTime() / 1000)
        sendingMessages = sendingMessages.filter((msg) => {
          return now - msg.timestamp < 10 * 60 // 10分钟
        })
        this.sendMessageQueue[channelKey] = sendingMessages
        return sendingMessages || []
      }
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
      let isUpdated = false
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
          this.removeSendMessageFromQueue(message.clientSeq, message.channel)
          isUpdated = true
        }
      }
      if (isUpdated) {
        scrollControl.scrollTo('chat-message-list', false)
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
      const list = Object.values(this.selectedMessagesByMessageID)
      return sortListByField(list, 'messageSeq')
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
    // 转发消息-逐条
    forwardMessages(selectedMessages) {
      const that = this
      if (!selectedMessages) {
        selectedMessages = this.getSelectedMessages()
      }
      if (selectedMessages.length === 0) {
        console.warn('没有选中的消息')
        return
      }
      conversationPicker({
        title: '转发',
        conversationList: this.conversationList,
        confirm: (selectedItems) => {
          if (selectedItems && selectedItems.length > 0) {
            for (let i = 0; i < selectedItems.length; i++) {
              const channel = selectedItems[i].channel
              for (let j = 0; j < selectedMessages.length; j++) {
                const messageItem = selectedMessages[j]
                const message = {
                  content: messageItem.content,
                  channel: channel,
                }
                that.sendMessage(message)
              }
            }
          }
          that.clearSelectedMessages()
        },
      })
    },
    // 合并转发消息到指定会话
    async mergeForwardMessages() {
      const that = this
      const selectedMessages = this.getSelectedMessages()
      if (selectedMessages.length === 0) {
        console.warn('没有选中的消息')
        return
      }

      conversationPicker({
        title: '合并转发',
        conversationList: this.conversationList,
        multiple: true,
        confirm: (selectedItems) => {
          if (selectedItems && selectedItems.length > 0) {
            let users = []
            let msgs = []
            for (const message of selectedMessages) {
              let channelInfo = getChannelInfo(newChannel(message.fromUID))
              users.push({ uid: message.fromUID, name: channelInfo?.title })
              if (message.content.contentType === MessageContentTypeConst.image) {
                message.content = {
                  ...message.content,
                  url: message.content.url,
                  remoteUrl: message.content.remoteUrl,
                  contentType: message.content.contentType,
                }
              }
              msgs.push(message)
            }
            for (let i = 0; i < selectedItems.length; i++) {
              const userItem = selectedItems[i]
              const channel = userItem.channel
              const messageContent = new MergeforwardContent(channel.channelType, users, msgs)
              const messageData = {
                content: messageContent,
                channel: channel,
              }
              that.sendMessage(messageData)
            }
          }
          that.clearSelectedMessages()
        },
      })
    },
  },
})

export function useChatOutsideStore() {
  return useChatStore(piniaStore)
}
