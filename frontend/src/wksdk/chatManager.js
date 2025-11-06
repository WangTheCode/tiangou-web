import { WKSDK, MessageText, Mention, Setting, Message, MessageStatus } from 'wukongimjssdk'
import { fetchChannelInfoIfNeed, getChannelInfo, newChannel } from '@/wksdk/channelManager'
import { useChatStore } from '@/stores/index'
import { MessageContentTypeConst, OrderFactor } from '@/wksdk/const'
import { Convert } from './dataConvert'
import { ImageContent, FileContent } from './model'
import { uploadFileToOSS } from './oss'
import { getUUID } from './utils'
import axios from 'axios'

// 填充消息排序的序号
export const fillOrder = (message) => {
  if (message.messageSeq && message.messageSeq !== 0) {
    message.order = OrderFactor * message.messageSeq
    return
  }
  const chatStore = useChatStore()
  const maxMessage = chatStore.getMessageMax()

  if (maxMessage) {
    if (message.clientMsgNo === maxMessage.clientMsgNo) {
      if (maxMessage.preMessage) {
        message.order = maxMessage.preMessage.order + 1
      } else {
        message.order = OrderFactor + 1
      }
    } else {
      message.order = maxMessage.order + 1
    }
  } else {
    message.order = OrderFactor + 1
  }
}

// 监听消息
export const messageListener = (message) => {
  const chatStore = useChatStore()
  console.log('📨 收到消息:', message, message.channel)
  const currentConversation = chatStore.currentConversation || {}
  if (!(currentConversation.channel && message.channel.isEqual(currentConversation.channel))) {
    return
  }
  if (message.contentType == MessageContentTypeConst.rtcData) {
    return
  }
  if (message.header.noPersist) {
    // 不存储的消息不显示
    return
  }
  // if (!message.send && message.header.reddot) {
  //     chatStore.setNeedSetUnread(true)
  // }
  // chatStore.
  const messageWrap = Convert.toMessageWrap(message)
  fillOrder(messageWrap)
  chatStore.appendMessage(messageWrap)
}

// 监听消息发送状态
export const messageStatusListener = (ackPacket) => {
  const chatStore = useChatStore()
  chatStore.updateMessageStatus(ackPacket)
  // 更新消息状态
  // const message = chatStore.findMessageWithClientSeq(ackPacket.clientSeq)
  // console.log('📨 收到消息发送状态:', ackPacket, message)
  // if (message) {
  //   message.message.messageID = ackPacket.messageID.toString()
  //   message.message.messageSeq = ackPacket.messageSeq
  //   // if (ackPacket.reasonCode === 1) {
  //   //     this.updateLastMessageIfNeed(message)
  //   //     message.status = MessageStatus.Normal
  //   //     this.removeSendingMessageIfNeed(ackPacket.clientSeq, this.channel)
  //   // } else {
  //   //     message.status = MessageStatus.Fail
  //   //     const sendingMessage = this.getSendingMessageWithClientMsgNo(message.clientMsgNo)
  //   //     if (sendingMessage) {
  //   //         sendingMessage.reasonCode = ackPacket.reasonCode
  //   //         this.fillOrder(sendingMessage)
  //   //     }

  //   // }
  //   message.reasonCode = ackPacket.reasonCode
  // }
  // chatStore.notifyListener()
}

export const sendMessage = (channel, data) => {
  return new Promise((resolve, reject) => {
    const { content, mention, reply } = data
    // const content = new MessageText(text)
    if (mention) {
      const mn = new Mention()
      mn.all = mention.all
      mn.uids = mention.uids
      content.mention = mn
    }
    const channelInfo = getChannelInfo(channel)
    let setting = new Setting()
    if (channelInfo?.orgData.receipt === 1) {
      setting.receiptEnabled = true
    }
    if (reply) {
      content.reply = reply
    }
    WKSDK.shared()
      .chatManager.send(content, channel, setting)
      .then((message) => {
        resolve(message)
      })
      .catch((err) => {
        reject(err)
      })
  })
}

export const sendFileMessage = (file, data) => {
  return new Promise((resolve, reject) => {
    const chatStore = useChatStore()

    let content = ''
    if (file.type && file.type.startsWith('image/')) {
      content = new ImageContent(file, data.imgData, data.width, data.height)
    } else if (file.type && file.type.startsWith('video/')) {
    } else {
      content = new FileContent(file)
    }

    const channel = chatStore.currentConversation.channel
    const message = renderMessageTempData(channel, content)
    // 先临时添加到消息列表，等待发送成功后更新状态
    messageListener(message)

    // 上传到oss
    const fileName = getUUID()
    const objectKey = `${message.channel.channelType}/${message.channel.channelID}/${fileName}${content.extension || ''}`
    const cancelToken = new axios.CancelToken((c) => {})
    uploadFileToOSS(file, {
      objectKey,
      // onProgress: (loaded, total) => {
      //   const completeProgress = (loaded / total) | 0
      // },
      cancelToken,
    })
      .then((url) => {
        content.url = url
        content.remoteUrl = url
        chatStore.sendMessage({ content: content })
      })
      .catch((err) => {
        reject(err)
      })

    resolve(message)
  })
}

export const renderMessageTempData = (channel, content) => {
  const chatStore = useChatStore()
  const connectUserInfo = chatStore.connectUserInfo
  const message = new Message()
  message.content = content

  message.channel = newChannel(channel.channelID, channel.channelType)
  message.clientMsgNo = getUUID()
  message.messageID = ''

  message.header = {}
  message.remoteExtra = {
    readedCount: 0,
    unreadCount: 0,
    revoke: false,
    editedAt: 0,
    isEdit: false,
    extra: {},
    extraVersion: 0,
  }
  message.setting = new Setting()

  message.fromUID = connectUserInfo.channel.channelID
  message.isDeleted = false

  message.timestamp = Date.now() / 1000
  message.status = MessageStatus.Wait
  message.voicePlaying = false
  message.voiceReaded = false
  return message
}
