import { WKSDK, WKChannel, WKTextContent, WKConnectStatus,WKTransportType } from '../index';

// 基础使用示例
async function basicExample() {
  console.log('=== WuKong IM Node.js SDK Basic Example ===');

  // 获取SDK实例
  const sdk = WKSDK.shared();

  // 设置调试模式
  sdk.options.isDebug = true;

  // WKSDK.shared().options.host = 'tgdd-ws.jx3kaihe.top'; // 默认端口为5200
  // WKSDK.shared().options.port = 443;
  // // 认证信息
  sdk.options.connectInfo = {
    uid: '2194c7d5b9b0452ab27fb4731eb0db5d',
    token: 'cccbbe6854ff4c6389204022ca323772'
  };
  // 设置连接信息
  sdk.connectURL = 'wss://tgdd-ws.jx3kaihe.top';
  sdk.connectionManager.setTransportType(WKTransportType.WebSocket);
  // 监听连接状态
  sdk.connectionManager.addDelegate({
    onConnectStatus: (status: WKConnectStatus, reasonCode: any) => {
      console.log(`连接状态变更: ${WKConnectStatus[status]} (${status}), 原因: ${reasonCode}`);

      if (status === WKConnectStatus.Connected) {
        console.log('✅ 已连接到服务器');
        sendTestMessage();
      } else if (status === WKConnectStatus.Disconnected) {
        console.log('❌ 与服务器断开连接');
      }
    },

    onKick: (reasonCode: number, reason: string) => {
      console.log(`❌ 被服务器踢出: ${reason} (${reasonCode})`);
    }
  });

  // 监听收到的消息
  sdk.chatManager.addDelegate({
    onRecvMessages: (message: any, left: number) => {
      console.log(`📨 收到消息: ${message.content?.digest() || '未知消息'}`);
      console.log(`   - 发送者: ${message.fromUid}`);
      console.log(`   - 频道: ${message.channel.channelId} (类型: ${message.channel.channelType})`);
      console.log(`   - 剩余消息数: ${left}`);
    },

    onMessageUpdate: (message: any, left: number) => {
      console.log(`🔄 消息更新: ${message.clientMsgNo}, 剩余: ${left}`);
    },

    onSendack: (sendackPacket: any, left: number) => {
      console.log(`✅ 消息发送确认: clientSeq=${sendackPacket.clientSeq}, 剩余: ${left}`);
    },

    onMessageDeleted: (message: any) => {
      console.log(`🗑️ 消息已删除: ${message.clientMsgNo}`);
    }
  });

  // 连接服务器
  console.log('🔄 正在连接服务器...');
  sdk.start();

  // 发送测试消息的函数
  function sendTestMessage() {
    console.log('📤 发送测试消息...');

    // 创建个人频道
    const personalChannel = WKChannel.personWithChannelID('friend_user');

    // 发送文本消息
    const textContent = new WKTextContent('Hello from WuKong IM Node.js SDK! 🚀');
    const textMessage = sdk.chatManager.sendMessage(textContent, personalChannel);
    console.log(`💬 发送文本消息: ${textMessage.clientMsgNo}`);

    // 创建群组频道
    const groupChannel = WKChannel.groupWithChannelID('test_group');

    // 发送群组消息
    const groupContent = new WKTextContent('群组消息测试 📢');
    const groupMessage = sdk.chatManager.sendMessage(groupContent, groupChannel);
    console.log(`👥 发送群组消息: ${groupMessage.clientMsgNo}`);
  }

  // 处理程序退出
  process.on('SIGINT', () => {
    console.log('\n🔄 正在断开连接...');
    sdk.stop();
    setTimeout(() => {
      console.log('👋 SDK已停止');
      process.exit(0);
    }, 1000);
  });

  // 10秒后发送另一条消息
  // setTimeout(() => {
  //   if (sdk.connectionManager.connectStatus === WKConnectStatus.Connected) {
  //     const channel = WKChannel.personWithChannelID('friend_user');
  //     const content = new WKTextContent('定时消息测试 ⏰');
  //     sdk.chatManager.sendMessage(content, channel);
  //     console.log('⏰ 发送定时消息');
  //   }
  // }, 10000);

  // 显示SDK状态信息
  // setInterval(() => {
  //   const status = sdk.getStatus();
  //   console.log('\n📊 SDK状态:', {
  //     version: status.version,
  //     connectStatus: WKConnectStatus[status.connectStatus],
  //     registeredContentTypes: status.registeredContentTypes.length,
  //     cacheStats: status.cacheStats
  //   });
  // }, 30000);
}

// 运行示例
if (require.main === module) {
  basicExample().catch(error => {
    console.error('❌ 示例运行失败:', error);
    process.exit(1);
  });
}

export default basicExample;