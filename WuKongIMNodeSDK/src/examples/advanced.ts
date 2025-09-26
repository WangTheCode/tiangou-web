import { WKSDK, WKChannel, WKTextContent, WKImageContent, WKCMDContent, WKConnectStatus, WKChannelInfo } from '../index';

// 高级功能示例
async function advancedExample() {
  console.log('=== WuKong IM Node.js SDK Advanced Example ===');

  const sdk = WKSDK.shared();
  sdk.options.isDebug = true;

  // 设置连接信息
  sdk.connectURL = 'ws://127.0.0.1:5001?uid=advanced_user&token=test_token&name=高级用户';

  // 自定义消息内容类型
  class CustomMessageContent extends WKTextContent {
    public customData: { [key: string]: any } = {};

    constructor(text: string = '', customData: { [key: string]: any } = {}) {
      super(text);
      this.customData = customData;
    }

    contentType(): number {
      return 1001; // 自定义消息类型
    }

    encode(): string {
      return JSON.stringify({
        text: this.text,
        customData: this.customData
      });
    }

    decode(content: string): void {
      try {
        const data = JSON.parse(content);
        this.text = data.text || '';
        this.customData = data.customData || {};
      } catch (error) {
        this.text = content;
      }
    }

    digest(): string {
      return `[自定义消息] ${this.text}`;
    }
  }

  // 注册自定义消息类型
  sdk.registerMessageContent(CustomMessageContent, 1001);

  // 设置频道信息提供者
  sdk.channelManager.channelInfoProvider = async (channel) => {
    console.log(`🔍 获取频道信息: ${channel.channelId}`);

    // 模拟从服务器获取频道信息
    return WKChannelInfo.fromMap({
      channelId: channel.channelId,
      channelType: channel.channelType,
      name: channel.channelType === 1 ? `用户_${channel.channelId}` : `群组_${channel.channelId}`,
      avatar: 'https://example.com/avatar.jpg',
      extra: { lastActive: Date.now() }
    });
  };

  // 设置同步频道消息提供者
  sdk.chatManager.syncChannelMessageProvider = async (channel, startSeq, endSeq, limit, pullMode) => {
    console.log(`🔄 同步频道消息: ${channel.channelId}, 起始: ${startSeq}, 结束: ${endSeq}, 限制: ${limit}`);

    // 模拟返回历史消息
    return [];
  };

  // 设置消息编辑提供者
  sdk.chatManager.messageEditProvider = async (message, newContent) => {
    console.log(`✏️ 编辑消息: ${message.clientMsgNo}`);
    message.content = newContent;
    return message;
  };

  // 设置离线消息处理
  sdk.setOfflineMessageProvider(
    // 拉取离线消息
    async (limit, messageSeq, callback) => {
      console.log(`📥 拉取离线消息: limit=${limit}, seq=${messageSeq}`);

      // 模拟离线消息
      callback([], false);
    },
    // 确认离线消息
    async (messageSeq, complete) => {
      console.log(`✅ 确认离线消息: seq=${messageSeq}`);
      complete();
    }
  );

  // 添加消息存储拦截器
  sdk.chatManager.addMessageStoreBeforeIntercept('spam_filter', (message) => {
    // 简单的垃圾消息过滤
    if (message.content && message.content.digest().includes('spam')) {
      console.log(`🚫 拦截垃圾消息: ${message.clientMsgNo}`);
      return false;
    }
    return true;
  });

  // 监听连接状态
  sdk.connectionManager.addDelegate({
    onConnectStatus: (status, reasonCode) => {
      console.log(`🔄 连接状态: ${WKConnectStatus[status]}`);

      if (status === WKConnectStatus.Connected) {
        demonstrateAdvancedFeatures();
      }
    }
  });

  // 监听消息
  sdk.chatManager.addDelegate({
    onRecvMessages: (message, left) => {
      console.log(`📨 收到消息: ${message.content?.digest()}`);

      // 自动回复逻辑
      if (message.content instanceof WKTextContent && message.content.text.includes('ping')) {
        setTimeout(() => {
          const replyChannel = WKChannel.personWithChannelID(message.fromUid);
          const replyContent = new WKTextContent('pong 🏓');
          sdk.chatManager.sendMessage(replyContent, replyChannel);
          console.log('🏓 自动回复 pong');
        }, 1000);
      }
    },

    onMessageUpdate: (message, left, total) => {
      if (total) {
        console.log(`🔄 批量消息更新: ${left}/${total}`);
      }
    }
  });

  // 监听频道信息更新
  sdk.channelManager.addDelegate({
    onChannelInfoUpdate: (channelInfo) => {
      console.log(`📋 频道信息更新: ${channelInfo.name}`);
    }
  });

  console.log('🚀 启动高级示例...');
  sdk.start();

  // 演示高级功能
  function demonstrateAdvancedFeatures() {
    console.log('🎯 演示高级功能...');

    // 1. 发送自定义消息
    const customChannel = WKChannel.personWithChannelID('custom_user');
    const customContent = new CustomMessageContent('自定义消息测试', {
      type: 'notification',
      priority: 'high',
      metadata: { sender: 'system' }
    });
    sdk.chatManager.sendMessage(customContent, customChannel);
    console.log('📤 发送自定义消息');

    // 2. 发送图片消息
    const imageChannel = WKChannel.groupWithChannelID('image_group');
    const imageContent = new WKImageContent('https://example.com/image.jpg');
    imageContent.width = 800;
    imageContent.height = 600;
    imageContent.size = 102400;
    sdk.chatManager.sendMessage(imageContent, imageChannel);
    console.log('🖼️ 发送图片消息');

    // 3. 发送命令消息
    const cmdChannel = WKChannel.personWithChannelID('bot_user');
    const cmdContent = new WKCMDContent('user_status', { online: true, lastSeen: Date.now() });
    sdk.chatManager.sendMessage(cmdContent, cmdChannel);
    console.log('⚡ 发送命令消息');

    // 4. 批量操作示例
    setTimeout(async () => {
      console.log('📦 演示批量操作...');

      const testChannel = WKChannel.groupWithChannelID('batch_test');

      // 批量发送消息
      for (let i = 1; i <= 5; i++) {
        const content = new WKTextContent(`批量消息 ${i}/5`);
        sdk.chatManager.sendMessage(content, testChannel);
      }

      // 拉取历史消息
      try {
        const messages = await sdk.chatManager.pullLastMessages(testChannel, 0, 0, 10);
        console.log(`📚 获取到 ${messages.length} 条历史消息`);
      } catch (error) {
        console.log('📚 历史消息获取失败:', error);
      }

      // 获取频道信息
      const channelInfo = await sdk.channelManager.getChannelInfo(testChannel);
      if (channelInfo) {
        console.log(`📋 频道信息: ${channelInfo.name}`);
      }
    }, 3000);
  }

  // 定期显示统计信息
  setInterval(() => {
    const status = sdk.getStatus();
    console.log('\n📊 高级统计信息:', {
      连接状态: WKConnectStatus[status.connectStatus],
      注册的消息类型: status.registeredContentTypes,
      缓存统计: status.cacheStats
    });
  }, 30000);

  // 程序退出处理
  process.on('SIGINT', () => {
    console.log('\n🔄 清理资源...');
    sdk.cleanup();
    setTimeout(() => {
      console.log('✨ 高级示例结束');
      process.exit(0);
    }, 1000);
  });
}

// 运行示例
if (require.main === module) {
  advancedExample().catch(error => {
    console.error('❌ 高级示例运行失败:', error);
    process.exit(1);
  });
}

export default advancedExample;