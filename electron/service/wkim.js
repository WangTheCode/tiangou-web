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
const { setAxiosConfig } = require('../utils/axiosInstance')
const {
  setSyncConversationsCallback,
  // setMessageUploadTaskCallback,
} = require('../wksdk/setCallback')
const { webService } = require('./web')
const { MessageContentTypeConst } = require('../wksdk/const')
const { sqlitedbService } = require('./database/sqlitedb')
const { reverseArray } = require('../utils')
const { ImageContent, MergeforwardContent } = require('../wksdk/model')
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

    // 监听连接状态（绑定 webService 的 this 上下文）
    sdk.connectManager.addConnectStatusListener(webService.setConnectStatus.bind(webService))

    sdk.chatManager.addMessageListener(webService.addMessageListener.bind(webService))

    sdk.conversationManager.addConversationListener(
      webService.addConversationListener.bind(webService)
    )

    // 监听消息发送状态
    sdk.chatManager.addMessageStatusListener(webService.addMessageStatusListener.bind(webService))

    setSyncConversationsCallback()
    // setMessageUploadTaskCallback()

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

    const httpConfig = {
      baseUrl: this.imConfig.api_addr,
      headers: {
        token: this.userInfo.token,
      },
    }

    // 同时配置项目 HTTP 和 axios
    setHttpOption(httpConfig)
    setAxiosConfig(httpConfig)

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
    let messageContent = content
    logger.info('sendMessage-data', JSON.stringify(data))
    // 处理文本消息
    if (content && content.text && content.contentType === MessageContentTypeConst.text) {
      messageContent = new MessageText(content.text)
    } else if (content && content.contentType === MessageContentTypeConst.image) {
      // 处理图片消息
      messageContent = new ImageContent(
        content.url,
        content.uploadKey,
        content.width,
        content.height
      )
    } else if (content && content.contentType === MessageContentTypeConst.mergeForward) {
      // 处理合并转发消息
      messageContent = new MergeforwardContent(channel.channelType, content.users, content.msgs)
    }

    // 处理 mention
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

  async setOpenConversation(conversation) {
    const c = WKSDK.shared().conversationManager.conversations.find(
      c =>
        c.channel.channelID === conversation.channel.channelID &&
        c.channel.channelType === conversation.channel.channelType
    )
    if (c) {
      WKSDK.shared().conversationManager.openConversation = c
    }
    return true
  }

  /**
   * 同步频道消息列表（智能路由到本地或远程）
   * 根据本地数据完整性判断是否需要请求远程API
   */
  async syncChannelMessageList(data) {
    const {
      limit,
      channel_id,
      channel_type,
      start_message_seq,
      end_message_seq,
      pull_mode,
      lastMessageSeq,
    } = data
    try {
      // 1. 查询本地数据库
      const localMessages = await sqlitedbService.getMessagesBySeqRange(
        channel_id,
        channel_type,
        start_message_seq,
        end_message_seq,
        limit
      )

      let isLocalComplete = false

      // 第一页判断会话最后一条消息Seq是否存在本地数据库中
      if (
        localMessages &&
        localMessages.length > 0 &&
        start_message_seq === 0 &&
        end_message_seq === 0
      ) {
        const hasLastMessage = localMessages.find(m => m.message_seq == lastMessageSeq)
        if (hasLastMessage) {
          isLocalComplete = this._checkLocalDataComplete(localMessages, limit)
        }
      } else {
        isLocalComplete = this._checkLocalDataComplete(localMessages, limit)
      }
      if (isLocalComplete) {
        // 本地数据完整，直接返回
        const reversedLocalMessages = reverseArray(localMessages)
        return {
          start_message_seq:
            reversedLocalMessages.length > 0 ? reversedLocalMessages[0].message_seq : 0,
          end_message_seq:
            reversedLocalMessages.length > 0
              ? reversedLocalMessages[reversedLocalMessages.length - 1].message_seq
              : 0,
          messages: reversedLocalMessages.map(m => {
            m.header = m.header ? JSON.parse(m.header) : null
            m.payload = m.payload ? JSON.parse(m.payload) : null
            m.message_idstr = m.message_id
            return m
          }),
          more: 0, // 本地完整，假设没有更多
        }
      }

      // 3. 本地数据不完整，请求后端API
      logger.info('api return')

      const response = await post('message/channel/sync', {
        limit,
        channel_id,
        channel_type,
        start_message_seq,
        end_message_seq,
        pull_mode,
      })

      const apiData = response.data || {}
      const apiMessages = apiData.messages || []

      // 4. 将API返回的消息存储到本地数据库
      if (apiMessages.length > 0) {
        const conversation_id = `${channel_id}_${channel_type}`
        await sqlitedbService.batchInsertMessages(conversation_id, apiMessages)
      }

      // 5. 返回API数据
      return {
        start_message_seq: apiData.start_message_seq || 0,
        end_message_seq: apiData.end_message_seq || 0,
        messages: apiMessages,
        more: apiData.more || 0,
      }
    } catch (error) {
      // 发生错误时，尝试返回本地数据（即使不完整）
      const fallbackMessages = await sqlitedbService
        .getMessagesBySeqRange(channel_id, channel_type, start_message_seq, end_message_seq, limit)
        .catch(() => [])

      return {
        start_message_seq: fallbackMessages.length > 0 ? fallbackMessages[0].message_seq : 0,
        end_message_seq:
          fallbackMessages.length > 0
            ? fallbackMessages[fallbackMessages.length - 1].message_seq
            : 0,
        messages: fallbackMessages,
        more: 0,
      }
    }
  }

  /**
   * 检查本地数据完整性
   * @param {Array} messages - 本地查询到的消息列表
   * @param {number} limit - 期望的消息数量
   * @returns {boolean} - 是否完整
   */
  _checkLocalDataComplete(messages, limit) {
    // 如果本地没有消息，认为不完整
    if (!messages || messages.length === 0) {
      return false
    }

    // 条件A：检查数量是否满足
    const hasEnoughMessages = messages.length === limit

    // 条件B：检查 message_seq 连续性
    const isContinuous = this._isSeqContinuous(messages)

    // 必须同时满足数量和连续性
    return hasEnoughMessages && isContinuous
  }

  /**
   * 检查 message_seq 连续性
   * @param {Array} messages - 消息列表
   * @returns {boolean} - 是否连续
   */
  _isSeqContinuous(messages) {
    if (!messages || messages.length === 0) return false
    if (messages.length === 1) return true // 单条消息认为是连续的

    // 提取所有 message_seq 并排序
    const seqs = messages.map(m => m.message_seq).sort((a, b) => a - b)

    // 检查连续性：相邻seq差值应为1
    for (let i = 1; i < seqs.length; i++) {
      if (seqs[i] - seqs[i - 1] !== 1) {
        return false // 发现缺口
      }
    }

    return true
  }

  /**
   * 停止服务，断开连接
   */
  stop() {
    try {
      if (this.sdk) {
        logger.info('[wkim] 断开 SDK 连接')
        this.sdk.disconnect()
      }
    } catch (error) {
      logger.error('[wkim] 停止服务失败:', error)
    }
  }
}

WkimService.toString = () => '[class WkimService]'

module.exports = {
  WkimService,
  wkimService: new WkimService(),
}
