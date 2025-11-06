'use strict'

const { BrowserWindow } = require('electron')
const { sqlitedbService } = require('./database/sqlitedb')
const { logger } = require('ee-core/log')
const { MessageContentTypeConst } = require('../wksdk/const')
const { MessageStatus } = require('wukongimjstcpsdk')

/**
 * 序列化 Conversation 对象，将 getter 属性转换为普通属性
 */
function serializeConversation(conversation) {
  if (!conversation) return conversation

  return {
    // 基础属性
    channel: conversation.channel,
    unread: conversation.unread,
    timestamp: conversation.timestamp,
    lastMessage: conversation.lastMessage,
    extra: conversation.extra,
    simpleReminders: conversation.simpleReminders,

    // Getter 属性 - 手动获取值并作为普通属性
    channelInfo: conversation.channelInfo,
    isMentionMe: conversation.isMentionMe,
    logicUnread: conversation.logicUnread,
    reminders: conversation.reminders,
    remoteExtra: conversation.remoteExtra,
  }
}
function serializeMessage(message) {
  if (!message) return message

  return {
    ...message,
    contentType: message.contentType,
    send: message.send,
  }
}
function serializeMessageContent(content) {
  if (!content) return content

  return {
    ...content,
    contentType: content.contentType,
    conversationDigest: content.conversationDigest,
  }
}

/**
 * 序列化消息状态回执对象
 * 主要解决 messageID 大整数在 IPC 传输中的序列化问题
 */
function serializeMessageAck(ack) {
  if (!ack) return ack

  return {
    ...ack,
    // 确保 messageID 和 messageSeq 作为字符串传输，避免大整数精度丢失
    messageID: String(ack.messageID || ''),
    messageSeq: Number(ack.messageSeq || 0),
  }
}

/**
 * 发送消息到web监听器
 * @class
 */
class WebService {
  constructor() {
    this.sendMessageStatusMap = new Map()
  }

  setConnectStatus(status, reasonCode) {
    const channel = 'controller.web.onConnectStatus'
    const mainWindow = BrowserWindow.getAllWindows().find(win => win.id == 1)
    if (mainWindow) {
      mainWindow.webContents.send(channel, {
        status,
        reasonCode,
      })
    }
  }
  addMessageListener(message) {
    if (message.content) {
      message.content = serializeMessageContent(message.content)
    }
    logger.info('addMessageListener', JSON.stringify(message))
    let payload = {}
    if (message.content && message.content.contentObj) {
      payload = message.content.contentObj
    } else {
      payload.type = message.content.contentType
      if (message.content.contentType === MessageContentTypeConst.text) {
        payload.content = message.content.text
      } else if (message.content.contentType === MessageContentTypeConst.image) {
        payload.height = message.content.height
        payload.width = message.content.width
        payload.url = message.content.url
      } else if (message.content.contentType === MessageContentTypeConst.smallVideo) {
        payload.cover = message.content.cover
        payload.height = message.content.height
        payload.width = message.content.width
        payload.second = message.content.second
        payload.size = message.content.size
        payload.type = message.content.type
        payload.url = message.content.url
      } else if (message.content.contentType === MessageContentTypeConst.file) {
        payload.name = message.content.name
        payload.size = message.content.size
        payload.type = message.content.type
        payload.url = message.content.url
      } else if (message.content.contentType === MessageContentTypeConst.mergeForward) {
        payload.channel_type = message.content.channelType
        payload.users = message.content.users
        payload.type = message.content.contentType
        payload.msgs = message.content.msgs.map(p => {
          return {
            from_uid: p.fromUID,
            message_id: p.messageID,
            timestamp: p.timestamp,
            payload: p.content.contentObj,
          }
        })
      }
    }
    const messageData = {
      channel_id: message.channel.channelID,
      channel_type: message.channel.channelType,
      client_msg_no: message.clientMsgNo,
      extra_version: 0,
      from_uid: message.fromUID,
      header: message.header,
      is_deleted: message.isDeleted ? 1 : 0,
      message_id: String(message.messageID || ''),
      message_seq: message.messageSeq || '',
      payload,
      readed: 0,
      setting: 0,
      signal_payload: '',
      timestamp: message.timestamp,
    }
    if (message.messageID) {
      sqlitedbService.addChatMessage(messageData)
    } else {
      this.sendMessageStatusMap.set(message.clientSeq, messageData)
    }
    const channel = 'controller.web.addMessageListener'
    const mainWindow = BrowserWindow.getAllWindows().find(win => win.id == 1)
    if (mainWindow) {
      mainWindow.webContents.send(channel, serializeMessage(message))
    }
  }
  addConversationListener(conversation, action) {
    const channel = 'controller.web.addConversationListener'
    const mainWindow = BrowserWindow.getAllWindows().find(win => win.id == 1)
    if (mainWindow) {
      mainWindow.webContents.send(channel, {
        conversation: serializeConversation(conversation),
        action,
      })
    }
  }
  syncConversationList(data) {
    const channel = 'controller.web.syncConversationList'
    const mainWindow = BrowserWindow.getAllWindows().find(win => win.id == 1)
    if (mainWindow) {
      mainWindow.webContents.send(channel, data)
    }
  }
  addMessageStatusListener(ack) {
    logger.info('addMessageStatusListener--', JSON.stringify(ack))
    const messageData = this.sendMessageStatusMap.get(ack.clientSeq)
    if (messageData) {
      messageData.message_id = String(ack.messageID || '')
      messageData.message_seq = ack.messageSeq
      messageData.header = {
        no_persist: ack.noPersist ? 1 : 0,
        red_dot: ack.reddot ? 1 : 0,
        sync_once: ack.syncOnce ? 1 : 0,
      }
      if (ack.reasonCode === 1) {
        messageData.status = MessageStatus.Normal
      } else {
        messageData.status = MessageStatus.Fail
      }
      sqlitedbService.addChatMessage(messageData)
      this.sendMessageStatusMap.delete(ack.clientSeq)
    }

    // 序列化 ack 对象，防止大整数传输问题
    const serializedAck = serializeMessageAck(ack)

    const channel = 'controller.web.addMessageStatusListener'
    const mainWindow = BrowserWindow.getAllWindows().find(win => win.id == 1)
    if (mainWindow) {
      logger.info('addMessageStatusListener send--', JSON.stringify(serializedAck))
      mainWindow.webContents.send(channel, serializedAck)
    }
  }
}
WebService.toString = () => '[class WebService]'

module.exports = {
  WebService,
  webService: new WebService(),
}
