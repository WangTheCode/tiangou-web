# WuKong IM Node.js SDK

悟空IM的Node.js版本SDK，支持完全私有化的即时通讯解决方案。

## 简介

本项目是[悟空IM](https://github.com/WuKongIM/WuKongIM)的Node.js SDK，基于iOS SDK完整移植而来，保持了与原版相同的API设计和功能特性。

## 特性

- 🚀 支持TCP和WebSocket双重连接方式
- 🔗 高性能原生TCP连接（推荐）
- 🌐 WebSocket连接支持（兼容Web环境）
- 🔐 端到端加密通信
- 📱 支持私聊、群聊
- 🎯 消息回执确认
- 🔄 自动重连机制
- 💾 本地消息存储
- 🎪 多媒体消息支持
- 📊 消息状态管理
- 🛡️ 数据包完整性校验

## 安装

```bash
npm install wukongim-node-sdk
```

## 快速开始

### TCP连接（推荐）

```typescript
import { WKSDK, WKChannel, WKTextContent, WKTransportType } from 'wukongim-node-sdk';

// 初始化SDK
const sdk = WKSDK.shared();

// 方式1：通过URL配置TCP连接
sdk.connectURL = 'tcp://your-server:5001?uid=test&token=your-token';

// 方式2：直接配置TCP连接选项
// sdk.options.host = 'your-server';
// sdk.options.port = 5001;
// sdk.options.transportType = 'tcp';
// sdk.options.connectInfo = { uid: 'test', token: 'your-token' };
// sdk.connectionManager.setTransportType(WKTransportType.TCP);

// 监听连接状态
sdk.connectionManager.addDelegate({
  onConnectStatus: (status, reasonCode) => {
    console.log('连接状态:', status, reasonCode);
  }
});

// 监听收到的消息
sdk.chatManager.addDelegate({
  onRecvMessages: (message, left) => {
    console.log('收到消息:', message.content);
  }
});

// 启动SDK
sdk.start();

// 发送文本消息
const channel = WKChannel.personWithChannelID('user123');
const content = new WKTextContent('Hello, WuKong IM!');
sdk.chatManager.sendMessage(content, channel);
```

### WebSocket连接

```typescript
import { WKSDK, WKTransportType } from 'wukongim-node-sdk';

const sdk = WKSDK.shared();

// WebSocket连接配置
sdk.connectURL = 'ws://your-server:5001?uid=test&token=your-token';
// 或手动设置
sdk.connectionManager.setTransportType(WKTransportType.WebSocket);

sdk.start();
```

## API 文档

详细API文档请参考 [docs](./docs) 目录。

## 示例

查看 [examples](./examples) 目录中的完整示例。

## 许可证

MIT License

npm install C:\Code\WuKongIMNodeSDK/wukongim-node-sdk-1.0.0.tgz