'use strict';

const { logger } = require('ee-core/log');
const {
  WKSDK,
  WKChannel,
  WKTextContent,
  WKConnectStatus,
  WKTransportType,
  WKConversationAction,
  WKConversation
} = require('wukongim-node-sdk');
const { post,get } = require('../utils/http');

/**
 * WKIM服务
 */
class WkimService {
  constructor() {
    this.sdk = WKSDK.shared();
    this._inited = false;
  }

  _initListeners() {
    if (this._inited) return;
    const { sdk } = this;



     // 监听连接状态
    sdk.connectionManager.addDelegate({
      onConnectStatus: (status, reasonCode) => {
        logger.info(`📡 TCP连接状态: ${WKConnectStatus[status]} (${status}), 原因: ${reasonCode}`);
        
        // 添加更详细的状态信息
        if (status === WKConnectStatus.Connecting) {
          logger.info('🔄 正在尝试连接...');
        } else if (status === WKConnectStatus.Connected) {
          logger.info('✅ TCP连接已建立');
        } else if (status === WKConnectStatus.Disconnected) {
          logger.info('❌ TCP连接断开');
          logger.info(`   断开原因代码: ${reasonCode}`);
        }
      },

      onKick: (reasonCode, reason) => {
        logger.info(`❌ 被服务器踢出: ${reason} (${reasonCode})`);
      }
    });

    // 监听收到的消息
    sdk.chatManager.addDelegate({
      onRecvMessages: (message, left) => {
        logger.info(`📨 通过TCP收到消息: ${message.content?.digest() || '未知消息'}`);
        logger.info(`   - 发送者: ${message.fromUid}`);
        logger.info(`   - 频道: ${message.channel.channelId} (类型: ${message.channel.channelType})`);
        logger.info(`   - 剩余消息数: ${left}`);
      },

      onMessageUpdate: (message, left) => {
        logger.info(`🔄 TCP消息更新: ${message.clientMsgNo}, 剩余: ${left}`);
      },

      onSendack: (sendackPacket, left) => {
        logger.info(`✅ TCP消息发送确认: clientSeq=${sendackPacket.clientSeq}, 剩余: ${left}`);
      },

      onMessageDeleted: (message) => {
        logger.info(`🗑️ TCP消息已删除: ${message.clientMsgNo}`);
      }
    });

    // 设置会话管理器同步回调
    sdk.conversationManager.syncConversationsCallback = async (filter) => {
      logger.info('过滤条件:', filter);
      
      if(!(this.imConfig && this.imConfig.api_addr && this.userInfo && this.userInfo.token)) {
        logger.info('111');
        return [];
      }
      logger.info('222');
      // 模拟从服务器获取会话列表
      // 在实际应用中，这里应该调用API获取真实的会话数据
      post(this.imConfig.api_addr+'conversation/sync',{ "msg_count": 1 }, {
        headers: {
          'token': this.userInfo.token
        }
      }).then(res => {
        console.log('🔄 111222', res);
      });
      // const mockConversations = [
      //   {
      //     channel: WKChannel.personWithChannelID('tcp_friend_1'),
      //     unread: 2,
      //     timestamp: Date.now() / 1000 - 3600, // 1小时前
      //   },
      //   {
      //     channel: WKChannel.personWithChannelID('tcp_friend_2'), 
      //     unread: 0,
      //     timestamp: Date.now() / 1000 - 1800, // 30分钟前
      //   },
      //   {
      //     channel: WKChannel.groupWithChannelID('tcp_group_1'),
      //     unread: 5,
      //     timestamp: Date.now() / 1000 - 900, // 15分钟前
      //   }
      // ].map(data => {
      //   const conversation = new WKConversation(data.channel);
      //   conversation.unread = data.unread;
      //   conversation.timestamp = data.timestamp;
      //   return conversation;
      // });

      // console.log(`✅ 模拟返回 ${mockConversations.length} 个会话`);
      // return mockConversations;
    };

    sdk.conversationManager.addConversationListener((conversation, action) => {
      logger.info('sdk.conversationManager.addConversationListener', conversation, action);
      if (action === WKConversationAction.add) { // 新增最近会话

      } else if (action === WKConversationAction.update) { // 更新最近会话

      } else if (action === WKConversationAction.remove) { // 删除最近会话

      }

    })

      this._inited = true;
  }

  setImConfig(imConfig) {
    logger.info('setImConfig', imConfig);
    this.imConfig = imConfig;
  }

  

  testConnect(host, port){
    return new Promise((resolve, reject) => {
      const net = require('net');
      const testSocket = new net.Socket();
      
      testSocket.setTimeout(5000);
      const testHost = host || '103.180.21.149';
      const testPort = port || 5100;
      testSocket.connect(testPort, testHost, () => {
        logger.info('✅ 网络连通性测试成功');
        testSocket.destroy();
        
        logger.info('🔄 正在通过TCP连接到服务器...');
        resolve();
      });
      testSocket.on('error', (err) => {
        console.error('❌ 网络连通性测试失败:', err);
        reject(err);
      });
      testSocket.on('timeout', () => {
        logger.info('❌ 网络连通性测试超时');
        testSocket.destroy();
        reject(new Error('网络连通性测试超时'));
      });
    });
  }

  async connectTcp(args) {

 
    this._initListeners();

    const { host, port , uid, token } = args || {};
    if (!uid || !token) {
      logger.info('connectTcp 参数缺失: 需要 uid 与 token');
      return false;
    }
    this.userInfo = args;
    const tcpAddr = this.imConfig.tcp_addr;
    const currentHost = host?host:tcpAddr.split(':')[0];
    const currentPort = port?port:tcpAddr.split(':')[1];


    await this.testConnect(currentHost, currentPort);

    this.sdk.options.isDebug = true;
    // 添加连接超时设置
    this.sdk.options.connectTimeout = 10000; // 10秒超时

    // 显式配置连接参数，避免 URL 解析差异
    this.sdk.options.host = currentHost;
    this.sdk.options.port = currentPort;
    this.sdk.options.transportType = 'tcp';
    this.sdk.options.connectInfo = { uid, token };

    // 同步传输类型与配置
    this.sdk.connectionManager.setTransportType(WKTransportType.TCP);
    this.sdk.connectionManager.setOptions(this.sdk.options);

    this.sdk.start();
   
 
    return true;
  }

  async syncConversationList(args) {
    logger.info('syncConversationList');
    try {
      const conversations = await this.sdk.conversationManager.sync({});
      console.log(`✅ 同步完成，共 ${conversations.length} 个会话`);
      
      return conversations;
    } catch (error) {
      console.error('❌ 同步失败:', error);
      return [];
    }
  }

  sendText({toUid, text}) {
    const channel = WKChannel.personWithChannelID(toUid);
    logger.info('sendText', channel);
    const content = new WKTextContent(text);
    logger.info('sendText content', content);
    return this.sdk.chatManager.sendMessage(content, channel);
  }

  stop() {
    // this.sdk.stop();
  }
}

WkimService.toString = () => '[class WkimService]';

module.exports = {
  WkimService,
  wkimService: new WkimService()
};