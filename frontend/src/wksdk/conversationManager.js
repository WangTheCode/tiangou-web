import ipcApiRoute from '@/utils/icp/ipcRoute'
import { isEE } from '@/utils/icp/ipcRenderer'
import { useChatStore } from '@/stores/index'
import WKSDK, {
  Message,
  ConversationAction,
  ChannelTypeGroup,
  ChannelTypePerson,
} from 'wukongimjssdk'
import { MessageContentTypeConst } from '@/wksdk/const'
import { Convert } from './dataConvert'
import dayjs from 'dayjs'
import chatApi from '@/api/chat'
import * as channelSettingManager from '@/wksdk/channelSettingManager'

export const conversationListener = (conversation, action) => {
  console.log('收到会话处理----->', conversation, action)
  const chatStore = useChatStore()
  const channelInfo = WKSDK.shared().channelManager.getChannelInfo(conversation.channel)
  if (!channelInfo) {
    WKSDK.shared().channelManager.fetchChannelInfo(conversation.channel)
  }
  if (action === ConversationAction.add) {
    console.log('ConversationAction-----add')
    // 过滤敏感词
    // if (conversation.lastMessage?.content && conversation.lastMessage?.contentType === MessageContentType.text) {
    //     conversation.lastMessage.content.text = ProhibitwordsService.shared.filter(conversation.lastMessage?.content.text)
    // }
    // this.conversations = [new ConversationWrap(conversation), ...this.conversations]
    // this.notifyListener()
    chatStore.addConversation(conversation)
  } else if (action === ConversationAction.update) {
    console.log('ConversationAction-----update')

    chatStore.updateConversation(conversation)
    // const existConversation = chatStore.findConversation(conversation)
    // if (existConversation) {
    //   existConversation.conversation = conversation
    // 过滤敏感词
    // if (existConversation.lastMessage?.content && existConversation.lastMessage?.contentType === MessageContentType.text) {
    //     existConversation.lastMessage.content.text = ProhibitwordsService.shared.filter(existConversation.lastMessage?.content.text)
    // }
    // }

    chatStore.sortConversations()
    // const conversationY = this.currentConversationListY()
    // console.log("conversationY----->", conversationY)
    // this.notifyListener(() => {
    //     if (conversationY) {
    //         this.keepPosition(conversationY)
    //     }
    // })
  } else if (action === ConversationAction.remove) {
    // this.removeConversation(conversation.channel)
  }
}

// 同步会话列表
export const syncConversationList = () => {
  return new Promise((resolve, reject) => {
    if (isEE) {
      ipcApiRoute
        .syncConversationList()
        .then((res) => {
          resolve(res.data)
        })
        .catch((err) => {
          reject(err)
        })
    } else {
      const chatStore = useChatStore()
      WKSDK.shared()
        .conversationManager.sync({})
        .then((conversations) => {
          chatStore.setConversationList(conversations)
          resolve(conversations)
        })
        .catch((err) => {
          reject(err)
        })
    }
  })
}

export const setOpenConversation = (conversation) => {
  WKSDK.shared().conversationManager.openConversation = conversation
  if (isEE) {
    ipcApiRoute.setOpenConversation(conversation)
  }
}

// 获取时间消息
export const getTimeMessage = (timestamp) => {
  const message = new Message()
  message.timestamp = timestamp
  message.clientMsgNo = timestamp.toString()
  message.content = {
    contentType: MessageContentTypeConst.time,
    timestamp: timestamp,
  }
  return message
}

// 消息去重
export const distinctMessages = (messages) => {
  for (let i = 0; i < messages.length; i++) {
    for (let j = i + 1; j < messages.length; j++) {
      if (
        messages[i].clientMsgNo &&
        messages[i].clientMsgNo !== '' &&
        messages[i].clientMsgNo === messages[j].clientMsgNo
      ) {
        messages.splice(j, 1)
        j--
      }
    }
  }
}

// 格式化时间
export const formatMessageTime = (message) => {
  return dayjs(message.timestamp * 1000).format('MM月DD日')
}

// 获取历史分割线消息
export const getHistorySplit = () => {
  const message = new Message()
  message.timestamp = new Date().getTime() / 10000
  message.clientMsgNo = `split-${message.timestamp}`
  message.content = {
    contentType: MessageContentTypeConst.historySplit,
  }
  return message
}

// 插入时间或历史消息分割线
export const insertTimeOrHistorySplit = (messages) => {
  const newMessages = []
  // TODO: 是否显示历史线
  const shouldShowHistorySplit = true
  const initLocateMessageSeq = 0
  if (messages && messages.length > 0) {
    for (let i = 0; i < messages.length; i++) {
      const message = messages[i]
      if (newMessages.length === 0) {
        const timeMessage = getTimeMessage(message.timestamp)
        newMessages.push(Convert.toMessageWrap(timeMessage))
      } else {
        const preMessage = newMessages[newMessages.length - 1]
        if (
          preMessage.contentType !== MessageContentTypeConst.time &&
          preMessage.contentType !== MessageContentTypeConst.historySplit &&
          formatMessageTime(preMessage) !== formatMessageTime(message)
        ) {
          const timeMessage = getTimeMessage(message.timestamp)
          newMessages.push(Convert.toMessageWrap(timeMessage))
        }
      }
      newMessages.push(message)
      if (
        shouldShowHistorySplit &&
        initLocateMessageSeq &&
        initLocateMessageSeq > 0 &&
        message.messageSeq === initLocateMessageSeq
      ) {
        newMessages.push(Convert.toMessageWrap(getHistorySplit()))
      }
    }
  }
  return newMessages
}

// 生成消息链表结构
export const genMessageLinkedData = (messages) => {
  if (messages) {
    for (let i = 0; i < messages.length; i++) {
      const message = messages[i]
      message.preMessage = undefined
      message.nextMessage = undefined
      if (i === 0 && messages.length > 1) {
        message.nextMessage = messages[i + 1]
      } else {
        message.preMessage = messages[i - 1]
        messages[i - 1].nextMessage = message
      }
    }
  }
  return messages
}

// 刷新消息列表
export const refreshMessages = (messages) => {
  let newMessages = messages
  distinctMessages(newMessages)
  newMessages = insertTimeOrHistorySplit(newMessages)
  // 过滤敏感词
  // for (let i = 0; i < newMessages.length; i++) {
  //     const message = newMessages[i]
  //     if (message.contentType === MessageContentType.text) {
  //         message.content.text = ProhibitwordsService.shared.filter(message.content.text)
  //     }
  // }
  return genMessageLinkedData(newMessages)
}

export const updateSetting = async (conversation, funcName, setting) => {
  try {
    const chatStore = useChatStore()
    await channelSettingManager[funcName](setting, conversation.channel)
    conversation.extra = {
      ...conversation.extra,
      [funcName]: setting ? 1 : 0,
    }
    chatStore.updateConversation(conversation)
    if (funcName === 'top') {
      chatStore.sortConversations()
    }
  } catch (error) {
    console.error(error)
    return false
  }
}

/**
 * 关闭聊天窗口
 * @param {*} conversation
 */
export const closeConversation = (conversation) => {
  return new Promise((resolve, reject) => {
    chatApi
      .closeConversation({
        channelID: conversation.channel.channelID,
        channelType: conversation.channel.channelType,
      })
      .then((res) => {
        const chatStore = useChatStore()
        chatStore.removeConversation(conversation)
        resolve(res)
      })
      .catch((err) => {
        console.error(err)
        reject(err)
      })
  })
}

// 清空聊天记录
export const clearChannelMessages = (conversation) => {
  return new Promise((resolve, reject) => {
    chatApi
      .clearChannelMessages({})
      .then((res) => {
        const chatStore = useChatStore()
        // chatStore.removeConversation(conversation)
        resolve(res)
      })
      .catch((err) => {
        console.error(err)
        reject(err)
      })
  })
}
