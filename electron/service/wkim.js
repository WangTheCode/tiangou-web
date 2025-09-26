'use strict';

const { logger } = require('ee-core/log');
const {
  WKSDK,
  WKChannel,
  WKTextContent,
  WKConnectStatus,
  WKTransportType
} = require('wukongim-node-sdk');

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

    this._inited = true;
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

    await this.testConnect(host, port);

    this.sdk.options.isDebug = true;
    // 添加连接超时设置
    this.sdk.options.connectTimeout = 10000; // 10秒超时

    // 显式配置连接参数，避免 URL 解析差异
    this.sdk.options.host = host;
    this.sdk.options.port = port;
    this.sdk.options.transportType = 'tcp';
    this.sdk.options.connectInfo = { uid, token };

    // 同步传输类型与配置
    this.sdk.connectionManager.setTransportType(WKTransportType.TCP);
    this.sdk.connectionManager.setOptions(this.sdk.options);

    this.sdk.start();
   
 
    return true;
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