# WuKong IM Node.js SDK 使用指南

## 目录

- [快速开始](#快速开始)
- [基本概念](#基本概念)
- [连接管理](#连接管理)
- [发送和接收消息](#发送和接收消息)
- [频道管理](#频道管理)
- [高级功能](#高级功能)
- [错误处理](#错误处理)
- [最佳实践](#最佳实践)

## 快速开始

### 安装

```bash
npm install wukongim-node-sdk
```

### 基础使用

```typescript
import { WKSDK, WKChannel, WKTextContent } from 'wukongim-node-sdk';

// 1. 获取SDK实例
const sdk = WKSDK.shared();

// 2. 配置连接信息
sdk.connectURL = 'ws://your-server:5001?uid=your-uid&token=your-token';

// 3. 监听连接状态
sdk.connectionManager.addDelegate({
  onConnectStatus: (status, reasonCode) => {
    if (status === WKConnectStatus.Connected) {
      console.log('连接成功');
    }
  }
});

// 4. 监听接收消息
sdk.chatManager.addDelegate({
  onRecvMessages: (message, left) => {
    console.log('收到消息:', message.content?.digest());
  }
});

// 5. 启动连接
sdk.start();

// 6. 发送消息
const channel = WKChannel.personWithChannelID('friend-id');
const content = new WKTextContent('Hello, World!');
sdk.chatManager.sendMessage(content, channel);
```

## 基本概念

### 频道 (Channel)

频道是消息的载体，代表一个聊天对象：

- **个人频道**: 一对一聊天，`channelType = 1`
- **群组频道**: 群聊，`channelType = 2`

```typescript
// 创建个人频道
const personalChannel = WKChannel.personWithChannelID('user123');

// 创建群组频道
const groupChannel = WKChannel.groupWithChannelID('group456');

// 自定义频道类型
const customChannel = WKChannel.channelID('custom789', 3);
```

### 消息内容 (MessageContent)

消息内容定义了消息的具体数据和格式：

```typescript
// 文本消息
const textContent = new WKTextContent('Hello World');

// 图片消息
const imageContent = new WKImageContent('https://example.com/image.jpg');
imageContent.width = 800;
imageContent.height = 600;

// 语音消息
const voiceContent = new WKVoiceContent('https://example.com/voice.mp3', 30);

// 系统消息
const systemContent = new WKSystemContent('用户加入群组');

// 命令消息
const cmdContent = new WKCMDContent('user_typing', { typing: true });
```

## 连接管理

### 连接状态监听

```typescript
import { WKConnectStatus, WKReason } from 'wukongim-node-sdk';

sdk.connectionManager.addDelegate({
  onConnectStatus: (status: WKConnectStatus, reasonCode: WKReason) => {
    switch (status) {
      case WKConnectStatus.NoConnect:
        console.log('未连接');
        break;
      case WKConnectStatus.Connecting:
        console.log('连接中...');
        break;
      case WKConnectStatus.Connected:
        console.log('已连接');
        break;
      case WKConnectStatus.Disconnected:
        console.log('连接断开');
        break;
    }
  },

  onKick: (reasonCode: number, reason: string) => {
    console.log('被踢出:', reason);
  }
});
```

### 连接控制

```typescript
// 主动连接
sdk.connectionManager.connect();

// 断开连接（允许自动重连）
sdk.connectionManager.disconnect(false);

// 强制断开连接（不允许自动重连）
sdk.connectionManager.disconnect(true);

// 登出（清理所有连接信息）
sdk.connectionManager.logout();

// 唤醒连接
sdk.connectionManager.wakeup(5000, (error) => {
  if (error) {
    console.log('唤醒失败:', error);
  } else {
    console.log('唤醒成功');
  }
});
```

### 动态获取连接地址

```typescript
sdk.connectionManager.getConnectAddr = (complete) => {
  // 从你的服务器获取连接地址
  fetch('/api/get-im-address')
    .then(response => response.json())
    .then(data => complete(data.address))
    .catch(() => complete());
};
```

## 发送和接收消息

### 发送消息

```typescript
const channel = WKChannel.personWithChannelID('friend123');

// 发送文本消息
const textContent = new WKTextContent('你好');
const message = sdk.chatManager.sendMessage(textContent, channel);

// 发送带设置的消息
const setting = new WKSetting();
setting.receipt = true;  // 需要回执
setting.signal = false;  // 非信令消息

sdk.chatManager.sendMessage(textContent, channel, setting);

// 发送话题消息
sdk.chatManager.sendMessage(textContent, channel, setting, 'topic123');
```

### 接收消息

```typescript
sdk.chatManager.addDelegate({
  onRecvMessages: (message: WKMessage, left: number) => {
    console.log('收到消息:', {
      from: message.fromUid,
      content: message.content?.digest(),
      channel: message.channel.channelId,
      remaining: left
    });

    // 根据消息类型处理
    if (message.content instanceof WKTextContent) {
      console.log('文本消息:', message.content.text);
    } else if (message.content instanceof WKImageContent) {
      console.log('图片消息:', message.content.url);
    }
  },

  onMessageUpdate: (message: WKMessage, left: number) => {
    console.log('消息更新:', message.clientMsgNo);
  },

  onSendack: (sendackPacket, left: number) => {
    console.log('消息发送确认:', sendackPacket.clientSeq);
  }
});
```

### 消息历史查询

```typescript
const channel = WKChannel.groupWithChannelID('group123');

// 查询最新消息
const latestMessages = await sdk.chatManager.pullLastMessages(channel, 0, 0, 20);

// 下拉加载更多（查询更早的消息）
const earlierMessages = await sdk.chatManager.pullDown(channel, 1000, 20);

// 上拉加载更多（查询更新的消息）
const newerMessages = await sdk.chatManager.pullUp(channel, 2000, 0, 20);

// 查询指定消息周围的消息
const aroundMessages = await sdk.chatManager.pullAround(channel, 1500, 0, 20);
```

### 消息操作

```typescript
// 重发消息
const resentMessage = sdk.chatManager.resendMessage(failedMessage);

// 编辑消息
const newContent = new WKTextContent('修改后的内容');
const editedMessage = await sdk.chatManager.editMessage(originalMessage, newContent);

// 删除消息
sdk.chatManager.deleteMessage(message);

// 撤回消息
sdk.chatManager.revokeMessage(message);

// 转发消息
const forwardedMessage = sdk.chatManager.forwardMessage(originalContent, targetChannel);
```

## 频道管理

### 频道信息

```typescript
// 设置频道信息提供者
sdk.channelManager.channelInfoProvider = async (channel) => {
  // 从你的服务器获取频道信息
  const response = await fetch(`/api/channels/${channel.channelId}?type=${channel.channelType}`);
  const data = await response.json();

  return {
    channelId: channel.channelId,
    channelType: channel.channelType,
    name: data.name,
    avatar: data.avatar,
    remark: data.remark,
    extra: data.extra
  };
};

// 获取频道信息
const channelInfo = await sdk.channelManager.getChannelInfo(channel);
if (channelInfo) {
  console.log('频道名称:', channelInfo.name);
}

// 刷新频道信息
const refreshedInfo = await sdk.channelManager.refreshChannelInfo(channel);
```

### 频道信息监听

```typescript
sdk.channelManager.addDelegate({
  onChannelInfoUpdate: (channelInfo) => {
    console.log('频道信息更新:', channelInfo.name);
  },

  onChannelInfoDeleted: (channel) => {
    console.log('频道信息删除:', channel.channelId);
  }
});
```

### 频道信息管理

```typescript
// 批量添加频道信息
const channelInfos = [
  { channelId: 'user1', channelType: 1, name: '用户1' },
  { channelId: 'group1', channelType: 2, name: '群组1' }
];
sdk.channelManager.addOrUpdateChannelInfos(channelInfos);

// 搜索频道信息
const searchResults = sdk.channelManager.searchChannelInfos('搜索关键词');

// 按类型获取频道信息
const personalChannels = sdk.channelManager.getChannelInfosByType(1);
const groupChannels = sdk.channelManager.getChannelInfosByType(2);
```

## 高级功能

### 自定义消息类型

```typescript
class CustomMessageContent extends WKMessageContent {
  public data: any;

  constructor(data: any = {}) {
    super();
    this.data = data;
  }

  contentType(): number {
    return 1001; // 自定义类型编号
  }

  encode(): string {
    return JSON.stringify(this.data);
  }

  decode(content: string): void {
    try {
      this.data = JSON.parse(content);
    } catch (error) {
      this.data = {};
    }
  }

  digest(): string {
    return '[自定义消息]';
  }
}

// 注册自定义消息类型
sdk.registerMessageContent(CustomMessageContent, 1001);

// 使用自定义消息
const customContent = new CustomMessageContent({
  type: 'location',
  lat: 39.9042,
  lng: 116.4074
});
sdk.chatManager.sendMessage(customContent, channel);
```

### 消息拦截器

```typescript
// 添加消息存储拦截器
sdk.chatManager.addMessageStoreBeforeIntercept('spam-filter', (message) => {
  // 过滤垃圾消息
  const content = message.content?.digest() || '';
  const spamKeywords = ['spam', '广告', '垃圾'];

  for (const keyword of spamKeywords) {
    if (content.includes(keyword)) {
      console.log('拦截垃圾消息:', content);
      return false; // 不存储此消息
    }
  }

  return true; // 允许存储
});

// 移除拦截器
sdk.chatManager.removeMessageStoreBeforeIntercept('spam-filter');
```

### 数据同步提供者

```typescript
// 设置消息同步提供者
sdk.chatManager.syncChannelMessageProvider = async (channel, startSeq, endSeq, limit, pullMode) => {
  const response = await fetch('/api/sync-messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      channelId: channel.channelId,
      channelType: channel.channelType,
      startSeq,
      endSeq,
      limit,
      pullMode
    })
  });

  const data = await response.json();
  return data.messages.map(msgData => {
    // 将服务器数据转换为 WKMessage 对象
    const message = new WKMessage();
    message.messageSeq = msgData.seq;
    message.fromUid = msgData.fromUid;
    message.contentType = msgData.contentType;
    message.content = sdk.createMessageContent(msgData.contentType);
    message.content.decode(msgData.content);
    return message;
  });
};

// 设置消息编辑提供者
sdk.chatManager.messageEditProvider = async (message, newContent) => {
  await fetch('/api/edit-message', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messageId: message.messageId,
      newContent: newContent.encode()
    })
  });

  message.content = newContent;
  return message;
};
```

### 离线消息处理

```typescript
sdk.setOfflineMessageProvider(
  // 拉取离线消息
  async (limit, messageSeq, callback) => {
    try {
      const response = await fetch('/api/offline-messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ limit, messageSeq })
      });

      const data = await response.json();
      const messages = data.messages.map(msgData => {
        // 转换服务器数据为 WKMessage
        return convertServerMessageToWKMessage(msgData);
      });

      callback(messages, data.hasMore);
    } catch (error) {
      callback([], false, error);
    }
  },

  // 确认离线消息
  async (messageSeq, complete) => {
    try {
      await fetch('/api/ack-offline-messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageSeq })
      });
      complete();
    } catch (error) {
      complete(error);
    }
  }
);
```

## 错误处理

### 连接错误

```typescript
sdk.connectionManager.addDelegate({
  onConnectStatus: (status, reasonCode) => {
    if (status === WKConnectStatus.Disconnected) {
      switch (reasonCode) {
        case WKReason.ConnectError:
          console.log('网络连接错误');
          break;
        case WKReason.TokenExpired:
          console.log('Token已过期，需要重新获取');
          // 重新获取token并重连
          refreshToken().then(newToken => {
            sdk.options.connectInfo.token = newToken;
            sdk.connectionManager.connect();
          });
          break;
        case WKReason.ConnectKick:
          console.log('被其他设备踢下线');
          break;
        default:
          console.log('未知连接错误:', reasonCode);
      }
    }
  }
});
```

### 消息发送失败

```typescript
sdk.chatManager.addDelegate({
  onSendack: (sendackPacket, left) => {
    if (sendackPacket.reasonCode !== 0) {
      console.log('消息发送失败:', sendackPacket.reasonCode);

      // 根据错误码处理
      switch (sendackPacket.reasonCode) {
        case 1:
          console.log('频道不存在');
          break;
        case 2:
          console.log('无权限发送消息');
          break;
        default:
          console.log('其他发送错误');
      }
    }
  }
});
```

### 异常捕获

```typescript
try {
  const messages = await sdk.chatManager.pullLastMessages(channel, 0, 0, 20);
  console.log('获取到消息:', messages.length);
} catch (error) {
  console.error('获取消息失败:', error);
}

// SDK启动时的错误处理
try {
  sdk.start();
} catch (error) {
  console.error('SDK启动失败:', error);

  // 检查配置是否正确
  const errors = sdk.options.validate();
  if (errors.length > 0) {
    console.log('配置错误:', errors);
  }
}
```

## 最佳实践

### 1. 连接管理

```typescript
class IMService {
  private sdk: WKSDK;
  private reconnectCount = 0;
  private maxReconnectCount = 5;

  constructor() {
    this.sdk = WKSDK.shared();
    this.setupConnectionHandling();
  }

  private setupConnectionHandling() {
    this.sdk.connectionManager.addDelegate({
      onConnectStatus: (status, reasonCode) => {
        switch (status) {
          case WKConnectStatus.Connected:
            this.reconnectCount = 0;
            this.onConnected();
            break;
          case WKConnectStatus.Disconnected:
            this.handleDisconnection(reasonCode);
            break;
        }
      }
    });
  }

  private handleDisconnection(reasonCode: WKReason) {
    if (reasonCode === WKReason.TokenExpired) {
      this.refreshTokenAndReconnect();
    } else if (this.reconnectCount < this.maxReconnectCount) {
      this.reconnectCount++;
      setTimeout(() => {
        this.sdk.connectionManager.connect();
      }, Math.pow(2, this.reconnectCount) * 1000); // 指数退避
    }
  }

  private async refreshTokenAndReconnect() {
    try {
      const newToken = await this.getNewToken();
      this.sdk.options.connectInfo!.token = newToken;
      this.sdk.connectionManager.connect();
    } catch (error) {
      console.error('Token刷新失败:', error);
    }
  }
}
```

### 2. 消息管理

```typescript
class MessageManager {
  private sdk: WKSDK;
  private messageCache = new Map<string, WKMessage>();

  constructor() {
    this.sdk = WKSDK.shared();
    this.setupMessageHandling();
  }

  private setupMessageHandling() {
    this.sdk.chatManager.addDelegate({
      onRecvMessages: (message, left) => {
        this.messageCache.set(message.clientMsgNo, message);
        this.processMessage(message);
      },

      onMessageUpdate: (message, left) => {
        this.messageCache.set(message.clientMsgNo, message);
        this.notifyMessageUpdate(message);
      }
    });
  }

  async sendMessageWithRetry(content: WKMessageContent, channel: WKChannel, maxRetries = 3): Promise<WKMessage> {
    let lastError: Error;

    for (let i = 0; i < maxRetries; i++) {
      try {
        return this.sdk.chatManager.sendMessage(content, channel);
      } catch (error) {
        lastError = error as Error;
        await this.delay(1000 * (i + 1)); // 延迟重试
      }
    }

    throw lastError!;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

### 3. 配置管理

```typescript
// 开发环境配置
const developmentConfig: Partial<WKOptions> = {
  isDebug: true,
  logLevel: 'debug',
  connectTimeout: 10000,
  messageTimeout: 15000,
};

// 生产环境配置
const productionConfig: Partial<WKOptions> = {
  isDebug: false,
  logLevel: 'warn',
  connectTimeout: 30000,
  messageTimeout: 30000,
  enableMessageCache: true,
  maxCachedMessages: 5000,
};

// 应用配置
const config = process.env.NODE_ENV === 'production' ? productionConfig : developmentConfig;
sdk.options = sdk.options.merge(config);
```

### 4. 内存管理

```typescript
class SDKManager {
  private sdk: WKSDK;
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    this.sdk = WKSDK.shared();

    // 定期清理缓存
    this.cleanupInterval = setInterval(() => {
      this.cleanupCache();
    }, 5 * 60 * 1000); // 每5分钟清理一次
  }

  private cleanupCache() {
    // 清理过期的频道信息缓存
    const cacheStats = this.sdk.channelManager.getCacheStats();
    if (cacheStats.total > this.sdk.options.maxCachedChannelInfos) {
      console.log('清理频道信息缓存...');
      // 实现LRU清理逻辑
    }
  }

  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.sdk.cleanup();
  }
}
```

### 5. 类型安全

```typescript
// 定义消息类型映射
interface MessageTypeMap {
  1: WKTextContent;
  2: WKImageContent;
  3: WKVoiceContent;
  99: WKCMDContent;
  1000: WKSystemContent;
}

function getTypedMessageContent<T extends keyof MessageTypeMap>(
  message: WKMessage,
  expectedType: T
): MessageTypeMap[T] | null {
  if (message.contentType === expectedType && message.content) {
    return message.content as MessageTypeMap[T];
  }
  return null;
}

// 使用示例
const textContent = getTypedMessageContent(message, 1);
if (textContent) {
  console.log('文本消息:', textContent.text); // TypeScript 知道这是 WKTextContent
}
```

## 调试和日志

### 启用调试模式

```typescript
sdk.options.isDebug = true;
sdk.options.logLevel = 'debug';

// 监听内部事件
sdk.connectionManager.on('packet', (packet) => {
  console.log('收到包:', packet.header.packetType);
});
```

### 获取运行状态

```typescript
// 获取详细状态
const status = sdk.getStatus();
console.log('SDK状态:', status);

// 定期输出状态
setInterval(() => {
  const stats = {
    connectStatus: sdk.connectionManager.connectStatus,
    cacheStats: sdk.channelManager.getCacheStats(),
    memoryUsage: process.memoryUsage()
  };
  console.log('运行状态:', stats);
}, 30000);
```