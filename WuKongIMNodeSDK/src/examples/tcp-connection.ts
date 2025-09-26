import { WKSDK, WKChannel, WKTextContent, WKConnectStatus, WKTransportType } from '../index';

// TCP连接示例
async function tcpConnectionExample() {
  console.log('=== WuKong IM TCP Connection Example ===');

  // 获取SDK实例
  const sdk = WKSDK.shared();

  // 设置调试模式
  sdk.options.isDebug = true;
  
  // 添加连接超时设置
  sdk.options.connectTimeout = 10000; // 10秒超时

  // 配置TCP连接（方式1：通过URL）
  sdk.connectURL = 'tcp://103.180.21.149:5100?uid=2194c7d5b9b0452ab27fb4731eb0db5d&token=cccbbe6854ff4c6389204022ca323772&name=TCP用户';

  // 或者直接配置选项（方式2：直接配置）
  // sdk.options.host = '127.0.0.1';
  // sdk.options.port = 5001;
  // sdk.options.transportType = 'tcp';
  // sdk.options.connectInfo = {
  //   uid: 'tcp_user',
  //   token: 'tcp_token',
  //   name: 'TCP用户'
  // };

  // 手动设置传输类型（方式3：手动设置）
  sdk.connectionManager.setTransportType(WKTransportType.TCP);

  // 监听连接状态
  sdk.connectionManager.addDelegate({
    onConnectStatus: (status: WKConnectStatus, reasonCode: any) => {
      console.log(`📡 TCP连接状态: ${WKConnectStatus[status]} (${status}), 原因: ${reasonCode}`);
      
      // 添加更详细的状态信息
      if (status === WKConnectStatus.Connecting) {
        console.log('🔄 正在尝试连接...');
      } else if (status === WKConnectStatus.Connected) {
        console.log('✅ TCP连接已建立');
        // sendTCPTestMessage();
        // showConnectionInfo();
      } else if (status === WKConnectStatus.Disconnected) {
        console.log('❌ TCP连接断开');
        console.log(`   断开原因代码: ${reasonCode}`);
      }
    },

    onKick: (reasonCode: number, reason: string) => {
      console.log(`❌ 被服务器踢出: ${reason} (${reasonCode})`);
    }
  });

  // 监听收到的消息
  sdk.chatManager.addDelegate({
    onRecvMessages: (message: any, left: number) => {
      console.log(`📨 通过TCP收到消息: ${message.content?.digest() || '未知消息'}`);
      console.log(`   - 发送者: ${message.fromUid}`);
      console.log(`   - 频道: ${message.channel.channelId} (类型: ${message.channel.channelType})`);
      console.log(`   - 剩余消息数: ${left}`);
    },

    onMessageUpdate: (message: any, left: number) => {
      console.log(`🔄 TCP消息更新: ${message.clientMsgNo}, 剩余: ${left}`);
    },

    onSendack: (sendackPacket: any, left: number) => {
      console.log(`✅ TCP消息发送确认: clientSeq=${sendackPacket.clientSeq}, 剩余: ${left}`);
    },

    onMessageDeleted: (message: any) => {
      console.log(`🗑️ TCP消息已删除: ${message.clientMsgNo}`);
    }
  });

  // 先测试网络连通性
  console.log('🔍 测试网络连通性...');
  const net = require('net');
  const testSocket = new net.Socket();
  
  testSocket.setTimeout(5000);
  testSocket.connect(5001, '103.180.21.149', () => {
    console.log('✅ 网络连通性测试成功');
    testSocket.destroy();
    
    console.log('🔄 正在通过TCP连接到服务器...');
    sdk.start();
  });
  
  testSocket.on('error', (err: any) => {
    console.log('❌ 网络连通性测试失败:', err.message);
    console.log('   请检查:');
    console.log('   1. 服务器地址是否正确: 103.180.21.149:5001');
    console.log('   2. 网络连接是否正常');
    console.log('   3. 防火墙是否阻止连接');
    console.log('   4. 服务器是否正在运行');
    testSocket.destroy();
  });
  
  testSocket.on('timeout', () => {
    console.log('❌ 网络连通性测试超时');
    testSocket.destroy();
  });

  // TCP测试消息发送函数
  function sendTCPTestMessage() {
    console.log('📤 通过TCP发送测试消息...');

    // 发送到个人频道
    const personalChannel = WKChannel.personWithChannelID('tcp_friend');
    const textContent = new WKTextContent('Hello from TCP connection! 🚀');
    const textMessage = sdk.chatManager.sendMessage(textContent, personalChannel);
    console.log(`💬 TCP文本消息发送: ${textMessage.clientMsgNo}`);

    // 发送到群组频道
    const groupChannel = WKChannel.groupWithChannelID('tcp_group');
    const groupContent = new WKTextContent('TCP群组消息测试 📢');
    const groupMessage = sdk.chatManager.sendMessage(groupContent, groupChannel);
    console.log(`👥 TCP群组消息发送: ${groupMessage.clientMsgNo}`);

    // 发送带有特殊字符的消息（测试编码）
    const specialChannel = WKChannel.personWithChannelID('special_user');
    const specialContent = new WKTextContent('特殊字符测试: 🌟✨💫 中文测试 éñ üñíçødé');
    sdk.chatManager.sendMessage(specialContent, specialChannel);
    console.log('🌟 特殊字符消息通过TCP发送');
  }

  // 显示连接信息
  function showConnectionInfo() {
    const connectionInfo = sdk.connectionManager.getConnectionInfo();
    console.log('\n📊 TCP连接信息:', {
      传输类型: connectionInfo.transportType,
      连接状态: WKConnectStatus[connectionInfo.status],
      是否已连接: connectionInfo.isConnected,
      重连次数: connectionInfo.reconnectCount,
      服务器地址: connectionInfo.address
    });
  }

  // 测试连接的健壮性
  setTimeout(() => {
    console.log('\n🔧 测试TCP连接功能...');

    // 测试ping
    sdk.connectionManager.sendPing();
    console.log('📡 发送TCP ping包');

    // 测试wakeup
    sdk.connectionManager.wakeup(5000, (error) => {
      if (error) {
        console.log('❌ TCP唤醒失败:', error.message);
      } else {
        console.log('✅ TCP连接唤醒成功');
      }
    });
  }, 5000);

  // 定期发送消息测试长连接
  let messageCount = 0;
  const tcpTestInterval = setInterval(() => {
    if (sdk.connectionManager.connectStatus === WKConnectStatus.Connected) {
      messageCount++;
      const channel = WKChannel.personWithChannelID('tcp_test_user');
      const content = new WKTextContent(`TCP长连接测试消息 #${messageCount} - ${new Date().toISOString()}`);
      sdk.chatManager.sendMessage(content, channel);
      console.log(`🔄 TCP长连接测试消息 #${messageCount}`);

      if (messageCount >= 5) {
        clearInterval(tcpTestInterval);
        console.log('✅ TCP长连接测试完成');
      }
    }
  }, 10000);

  // 程序退出处理
  process.on('SIGINT', () => {
    console.log('\n🔄 正在断开TCP连接...');
    clearInterval(tcpTestInterval);
    sdk.stop();
    setTimeout(() => {
      console.log('👋 TCP连接示例结束');
      process.exit(0);
    }, 1000);
  });

  // 错误处理
  process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ TCP连接过程中发生未处理的Promise拒绝:', reason);
  });

  process.on('uncaughtException', (error) => {
    console.error('❌ TCP连接过程中发生未捕获的异常:', error);
  });
}

// 对比WebSocket和TCP连接的示例
async function compareTransportsExample() {
  console.log('\n=== Transport Comparison Example ===');

  // TCP连接配置
  const tcpSDK = WKSDK.shared();
  tcpSDK.options.host = '103.180.21.149';
  tcpSDK.options.port = 5001;
  tcpSDK.options.transportType = 'tcp';
  tcpSDK.options.connectInfo = {
    uid: '2194c7d5b9b0452ab27fb4731eb0db5d',
    token: 'cccbbe6854ff4c6389204022ca323772'
  };

  tcpSDK.connectionManager.setTransportType(WKTransportType.TCP);

  // WebSocket连接配置（需要重新创建实例）
  // 注意：实际使用中通常不会在同一个程序中同时使用两种连接
  console.log('📊 传输方式对比:');
  console.log('- TCP: 原生Socket连接，性能更好，延迟更低');
  console.log('- WebSocket: HTTP升级协议，更适合Web环境');
  console.log('- 推荐在Node.js服务器环境中使用TCP连接');
}

// 运行示例
if (require.main === module) {
  tcpConnectionExample()
    // .then(() => compareTransportsExample()) // 暂时注释掉避免连接冲突
    .catch(error => {
      console.error('❌ TCP连接示例运行失败:', error);
      process.exit(1);
    });
}

export { tcpConnectionExample, compareTransportsExample };