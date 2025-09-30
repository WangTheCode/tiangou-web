'use strict'

const { logger } = require('ee-core/log')
const {
  WKSDK,
  ConnectStatus,
  MessageText,
  Channel,
  ChannelTypePerson,
} = require('wukongimjstcpsdk')
const { post, setHttpOption } = require('../utils/http')
const { dataSourceService } = require('./dataSource')
const { webService } = require('./web')
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

    sdk.chatManager.addMessageListener(message => {
      logger.info('📨 收到消息:' + JSON.stringify(message))
    })

    // 监听消息发送状态
    sdk.chatManager.addMessageStatusListener(ack => {
      if (ack.reasonCode === 1) {
        console.log('✅ 消息发送成功')
      } else {
        console.log(`❌ 消息发送失败 (错误码: ${ack.reasonCode})`)
      }
    })

    dataSourceService.setSyncConversationsCallback(sdk)

    this._inited = true
  }

  setImConfig(imConfig) {
    logger.info('setImConfig', imConfig)

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
    logger.info('syncConversationList')
    try {
      const conversations = await this.sdk.conversationManager.sync({})
      //   if (conversations && conversations.length > 0) {
      //     for (const conversation of conversations) {
      //         if (conversation.lastMessage?.content && conversation.lastMessage?.contentType == MessageContentType.text) {
      //             conversation.lastMessage.content.text = ProhibitwordsService.shared.filter(conversation.lastMessage.content.text)
      //         }
      //         conversationWraps.push(new ConversationWrap(conversation))
      //     }
      // }
      // console.log(`✅ 同步完成，共 ${conversations.length} 个会话`);
      // logger.info('conversations', 444);
      return conversations
    } catch (error) {
      return []
    }
  }

  sendText({ toUid, text }) {
    const channel = WKChannel.personWithChannelID(toUid)
    logger.info('sendText', channel)
    const content = new WKTextContent(text)
    logger.info('sendText content', content)
    return this.sdk.chatManager.sendMessage(content, channel)
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
