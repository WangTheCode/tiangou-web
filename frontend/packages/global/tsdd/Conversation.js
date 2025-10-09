import { MessageWrap } from './Model'
import { Message, MessageContentType } from 'wukongimjssdk'
import dayjs from 'dayjs'
import { MessageContentTypeConst } from './Const'

export class Conversation {
  constructor() {
    this.shouldShowHistorySplit = true
    this.initLocateMessageSeq = 0
  }

  // 刷新消息列表
  refreshMessages(messages) {
    let newMessages = messages
    this.distinctMessages(newMessages)
    newMessages = this.insertTimeOrHistorySplit(newMessages)
    // 过滤敏感词
    // for (let i = 0; i < newMessages.length; i++) {
    //     const message = newMessages[i]
    //     if (message.contentType === MessageContentType.text) {
    //         message.content.text = ProhibitwordsService.shared.filter(message.content.text)
    //     }
    // }
    return this.genMessageLinkedData(newMessages)
  }

  // 生成消息链表结构
  genMessageLinkedData(messages) {
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
  // 插入时间或历史消息分割线
  insertTimeOrHistorySplit(messages) {
    const newMessages = []
    const shouldShowHistorySplit = this.shouldShowHistorySplit
    if (messages && messages.length > 0) {
      for (let i = 0; i < messages.length; i++) {
        const message = messages[i]
        if (newMessages.length === 0) {
          const timeMessage = this.getTimeMessage(message.timestamp)
          newMessages.push(new MessageWrap(timeMessage))
        } else {
          const preMessage = newMessages[newMessages.length - 1]
          if (
            preMessage.contentType !== MessageContentTypeConst.time &&
            preMessage.contentType !== MessageContentTypeConst.historySplit &&
            this.formatMessageTime(preMessage) !== this.formatMessageTime(message)
          ) {
            const timeMessage = this.getTimeMessage(message.timestamp)
            newMessages.push(new MessageWrap(timeMessage))
          }
        }
        newMessages.push(message)
        if (
          shouldShowHistorySplit &&
          this.initLocateMessageSeq &&
          this.initLocateMessageSeq > 0 &&
          message.messageSeq === this.initLocateMessageSeq
        ) {
          newMessages.push(new MessageWrap(this.getHistorySplit()))
        }
      }
    }
    return newMessages
  }

  // 获取时间消息
  getTimeMessage(timestamp) {
    const message = new Message()
    message.timestamp = timestamp
    message.clientMsgNo = timestamp.toString()
    message.content = {
      contentType: MessageContentTypeConst.time,
      timestamp: timestamp,
    }
    return message
  }

  // 格式化时间
  formatMessageTime(message) {
    return dayjs(message.timestamp * 1000).format('MM月DD日')
  }

  // 获取历史分割线消息
  getHistorySplit() {
    const message = new Message()
    message.timestamp = new Date().getTime() / 10000
    message.clientMsgNo = `split-${message.timestamp}`
    message.content = {
      contentType: MessageContentTypeConst.historySplit,
    }
    return message
  }
  // 消息去重
  distinctMessages(messages) {
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
}
