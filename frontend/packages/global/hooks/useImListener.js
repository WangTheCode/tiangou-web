import { ConnectStatus } from 'wukongimjssdk'
import { useChatStore } from '../stores/index'
import WKSDK, { ConversationAction } from 'wukongimjssdk'
import { ConversationWrap } from '../tsdd/ConversationWrap'
import { MessageContentTypeConst, OrderFactor } from '../tsdd/Const'
import { MessageWrap } from '../tsdd/Model'

export const useImListener = () => {
  const chatStore = useChatStore()

  // 监听连接状态
  const connectStatusListener = status => {
    console.log('📨 监听连接状态:' + status)
    if (status === ConnectStatus.Connecting) {
      chatStore.setConnectStatus('loading')
    } else if (status === ConnectStatus.Connected) {
      chatStore.setConnectStatus('success')
    } else {
      chatStore.setConnectStatus('error')
    }
  }

  // 填充消息排序的序号
  const fillOrder = message => {
    if (message.messageSeq && message.messageSeq !== 0) {
      message.order = OrderFactor * message.messageSeq
      return
    }
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
  const messageListener = message => {
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
    const messageWrap = new MessageWrap(message)
    fillOrder(messageWrap)
    chatStore.appendMessage(messageWrap)
  }

  // 监听消息发送状态
  const messageStatusListener = ackPacket => {
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

  const conversationListener = (conversation, action) => {
    console.log('收到会话处理----->', conversation, action)
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

  return {
    connectStatusListener,
    messageListener,
    messageStatusListener,
    conversationListener,
  }
}
