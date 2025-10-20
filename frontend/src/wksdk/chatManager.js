import { WKSDK, MessageText, Mention, Setting } from 'wukongimjssdk'
import { fetchChannelInfoIfNeed, getChannelInfo } from '@/wksdk/channelManager'
import { useChatStore } from '@/stores/index'
import { MessageContentTypeConst, OrderFactor } from '@/wksdk/const'
import { Convert } from './dataConvert'

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
  const messageWrap = Convert.toMessageWrap(message)
  fillOrder(messageWrap)
  chatStore.appendMessage(messageWrap)
}

// 监听消息发送状态
export const messageStatusListener = (ackPacket) => {
  const chatStore = useChatStore()
  const message = chatStore.findMessageWithClientSeq(ackPacket.clientSeq)
  if (message) {
    message.message.messageID = ackPacket.messageID.toString()
    message.message.messageSeq = ackPacket.messageSeq
    // if (ackPacket.reasonCode === 1) {
    //     this.updateLastMessageIfNeed(message)
    //     message.status = MessageStatus.Normal
    //     this.removeSendingMessageIfNeed(ackPacket.clientSeq, this.channel)
    // } else {
    //     message.status = MessageStatus.Fail
    //     const sendingMessage = this.getSendingMessageWithClientMsgNo(message.clientMsgNo)
    //     if (sendingMessage) {
    //         sendingMessage.reasonCode = ackPacket.reasonCode
    //         this.fillOrder(sendingMessage)
    //     }

    // }
    message.reasonCode = ackPacket.reasonCode
  }
  // chatStore.notifyListener()
}

export const sendMessage = (channel, data) => {
  return new Promise((resolve, reject) => {
    const { text, mention } = data
    const content = new MessageText(text)
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
    WKSDK.shared()
      .chatManager.send(content, channel, setting)
      .then((message) => {
        console.log('tcp sendMessage----->', message)
        resolve(message)
      })
      .catch((err) => {
        reject(err)
      })
  })
}
