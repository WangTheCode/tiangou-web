'use strict'

const { logger } = require('ee-core/log')
const {
  WKSDK,
  ConnectStatus,
  MessageText,
  Channel,
  ChannelTypePerson,
  Mention,
  Setting,
} = require('wukongimjstcpsdk')
const { post, setHttpOption } = require('../utils/http')
const { setSyncConversationsCallback } = require('../wksdk/setCallback')
const { webService } = require('./web')
const { MessageContentTypeConst } = require('../wksdk/const')
/**
 * WKIM服务
 */
class WkimService {
  constructor() {
    this.sdk = WKSDK.shared()
    this._inited = false
  }

  _initListeners() {
    if (this._inited) return
    const { sdk } = this

    // 监听连接状态
    sdk.connectManager.addConnectStatusListener(webService.setConnectStatus)

    sdk.chatManager.addMessageListener(webService.addMessageListener)

    sdk.conversationManager.addConversationListener(webService.addConversationListener)

    // 监听消息发送状态
    sdk.chatManager.addMessageStatusListener(webService.addMessageStatusListener)

    setSyncConversationsCallback()

    this._inited = true
  }

  setImConfig(imConfig) {
    this.imConfig = imConfig
  }

  async connectTcp(args) {
    this._initListeners()

    const { uid, token } = args || {}
    if (!uid || !token) {
      return false
    }
    this.userInfo = args

    setHttpOption({
      baseUrl: this.imConfig.api_addr,
      headers: {
        token: this.userInfo.token,
      },
    })

    this.sdk.config.addr = this.imConfig.tcp_addr
    this.sdk.config.uid = uid
    this.sdk.config.token = token
    this.sdk.connect()
    return true
  }

  async syncConversationList() {
    try {
      const conversations = await this.sdk.conversationManager.sync({})

      // 序列化 Conversation 对象，保留 getter 属性
      const serializedConversations = conversations.map(conversation => ({
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
      }))

      return serializedConversations
    } catch (error) {
      return []
    }
  }

  async sendMessage(data) {
    const { content, mention, channel, reply } = data
    logger.info('sendMessage----->', JSON.stringify(content))
    let messageContent = content
    if (content && content.text && content.contentType === MessageContentTypeConst.text) {
      messageContent = new MessageText(content.text)
    }
    if (mention) {
      const mn = new Mention()
      mn.all = mention.all
      mn.uids = mention.uids
      messageContent.mention = mn
    }
    const channelObject = new Channel(channel.channelID, channel.channelType)
    const channelInfo = WKSDK.shared().channelManager.getChannelInfo(channelObject)
    let setting = new Setting()
    if (channelInfo?.orgData.receipt === 1) {
      setting.receiptEnabled = true
    }
    if (reply) {
      messageContent.reply = reply
    }
    const message = await this.sdk.chatManager.send(messageContent, channel, setting)
    return message
  }

  stop() {
    // this.sdk.stop();
  }
}

WkimService.toString = () => '[class WkimService]'

module.exports = {
  WkimService,
  wkimService: new WkimService(),
}
