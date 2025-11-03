'use strict'

const { BrowserWindow } = require('electron')

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
 * 发送消息到web监听器
 * @class
 */
class WebService {
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
  /**
   * 监听收到新消息（仅负责转发到前端，数据库存储由 wkimService 处理）
   */
  addMessageListener(message) {
    if (message.content) {
      message.content = serializeMessageContent(message.content)
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
  /**
   * 监听消息发送状态（仅负责转发到前端，数据库更新由 wkimService 处理）
   */
  addMessageStatusListener(ack) {
    const channel = 'controller.web.addMessageStatusListener'
    const mainWindow = BrowserWindow.getAllWindows().find(win => win.id == 1)
    if (mainWindow) {
      mainWindow.webContents.send(channel, ack)
    }
  }
}
WebService.toString = () => '[class WebService]'

module.exports = {
  WebService,
  webService: new WebService(),
}
