# WuKong IM Node.js SDK API 文档

## 目录

- [核心类](#核心类)
- [连接管理](#连接管理)
- [消息处理](#消息处理)
- [频道管理](#频道管理)
- [数据模型](#数据模型)
- [协议定义](#协议定义)

## 核心类

### WKSDK

悟空IM SDK的主入口类，采用单例模式。

#### 静态方法

```typescript
static shared(): WKSDK
```
获取SDK单例实例。

#### 属性

```typescript
options: WKOptions                    // SDK配置选项
connectURL: string                    // 连接URL
connectionManager: WKConnectionManager // 连接管理器
chatManager: WKChatManager           // 聊天管理器
channelManager: WKChannelManager     // 频道管理器
sdkVersion: string                   // SDK版本号（只读）
```

#### 方法

```typescript
// 配置和控制
isDebug(): boolean                   // 是否调试模式
start(): void                        // 启动SDK
stop(): void                         // 停止SDK
restart(): void                      // 重启SDK
reset(): void                        // 重置SDK到初始状态

// 消息内容类型管理
registerMessageContent(contentClass: new() => WKMessageContent, contentType?: number): void
getMessageContent(contentType: number): new() => WKMessageContent
createMessageContent(contentType: number): WKMessageContent
isSystemMessage(contentType: number): boolean

// 离线消息处理
setOfflineMessageProvider(pull: WKOfflineMessagePull, ack: WKOfflineMessageAck): void

// 状态和配置
getStatus(): object                  // 获取SDK状态信息
exportConfig(): object              // 导出当前配置
loadOptionsFromConfig(config: object): void // 从配置加载选项
```

#### 使用示例

```typescript
import { WKSDK, WKTextContent, WKChannel } from 'wukongim-node-sdk';

const sdk = WKSDK.shared();
sdk.connectURL = 'ws://localhost:5001?uid=user123&token=your-token';

// 监听连接状态
sdk.connectionManager.addDelegate({
  onConnectStatus: (status, reasonCode) => {
    console.log('连接状态:', status);
  }
});

// 启动SDK
sdk.start();
```

## 连接管理

### WKConnectionManager

负责与服务器的WebSocket连接管理。

#### 属性

```typescript
connectStatus: WKConnectStatus       // 当前连接状态（只读）
getConnectAddr?: (complete: (addr?: string) => void) => void // 获取连接地址回调
```

#### 方法

```typescript
// 连接控制
connect(): void                      // 连接服务器
disconnect(force: boolean): void     // 断开连接
logout(): void                       // 登出

// 数据发送
sendPacket(packet: WKPacket): void   // 发送协议包
writeData(data: Buffer): void        // 发送原始数据
sendPing(): void                     // 发送ping包

// 高级功能
wakeup(timeout: number, complete?: (error?: Error) => void): void // 唤醒连接

// 委托管理
addDelegate(delegate: WKConnectionManagerDelegate): void    // 添加委托
removeDelegate(delegate: WKConnectionManagerDelegate): void // 移除委托
```

#### 委托接口

```typescript
interface WKConnectionManagerDelegate {
  onConnectStatus?(status: WKConnectStatus, reasonCode: WKReason): void;
  onKick?(reasonCode: number, reason: string): void;
}
```

#### 连接状态

```typescript
enum WKConnectStatus {
  NoConnect = 0,      // 未连接
  Connecting = 1,     // 连接中
  PullingOffline = 2, // 拉取离线中
  Connected = 3,      // 已建立连接
  Disconnected = 4,   // 断开连接
}
```

## 消息处理

### WKChatManager

负责消息的发送、接收和管理。

#### 核心方法

```typescript
// 发送消息
sendMessage(content: WKMessageContent, channel: WKChannel, setting?: WKSetting, topic?: string): WKMessage
sendMessage(message: WKMessage, addRetryQueue?: boolean): WKMessage
resendMessage(message: WKMessage): WKMessage

// 保存消息
saveMessage(content: WKMessageContent, channel: WKChannel, fromUid?: string, status?: number): WKMessage
saveMessages(messages: WKMessage[]): WKMessage[]
addOrUpdateMessages(messages: WKMessage[], notify?: boolean): void

// 消息操作
forwardMessage(content: WKMessageContent, channel: WKChannel): WKMessage
editMessage(message: WKMessage, newContent: WKMessageContent): Promise<WKMessage>
deleteMessage(message: WKMessage): void
revokeMessage(message: WKMessage): void

// 消息查询
pullLastMessages(channel: WKChannel, endOrderSeq?: number, maxMessageSeq?: number, limit?: number): Promise<WKMessage[]>
pullDown(channel: WKChannel, startOrderSeq: number, limit: number): Promise<WKMessage[]>
pullUp(channel: WKChannel, startOrderSeq: number, endOrderSeq?: number, limit?: number): Promise<WKMessage[]>
pullAround(channel: WKChannel, orderSeq: number, maxMessageSeq?: number, limit?: number): Promise<WKMessage[]>

// 消息清理
clearMessages(channel: WKChannel): void
clearAllMessages(): void
clearFromMsgSeq(channel: WKChannel, maxMsgSeq: number, isContain: boolean): void

// 消息更新
updateMessageVoiceReaded(message: WKMessage): void
updateMessageLocalExtra(message: WKMessage): void
updateMessageRemoteExtra(message: WKMessage): Promise<void>
```

#### 委托接口

```typescript
interface WKChatManagerDelegate {
  onRecvMessages?(message: WKMessage, left: number): void;
  onMessageUpdate?(message: WKMessage, left: number, total?: number): void;
  onSendack?(sendackPacket: any, left: number): void;
  onMessageDeleted?(message: WKMessage): void;
  onMessageCleared?(channel: WKChannel): void;
  onMessageAllCleared?(): void;
  onMessageStream?(stream: any): void;
}
```

#### 拦截器

```typescript
// 添加消息存储拦截器
addMessageStoreBeforeIntercept(sid: string, intercept: (message: WKMessage) => boolean): void
removeMessageStoreBeforeIntercept(sid: string): void
```

#### 数据提供者

```typescript
// 同步频道消息提供者
syncChannelMessageProvider?: (channel: WKChannel, startSeq: number, endSeq: number, limit: number, pullMode: number) => Promise<WKMessage[]>

// 同步消息扩展提供者
syncMessageExtraProvider?: (channel: WKChannel, messageIds: number[]) => Promise<any[]>

// 更新消息扩展提供者
updateMessageExtraProvider?: (message: WKMessage, extra: any) => Promise<void>

// 消息编辑提供者
messageEditProvider?: (message: WKMessage, newContent: WKMessageContent) => Promise<WKMessage>
```

## 频道管理

### WKChannelManager

负责频道信息的管理和缓存。

#### 方法

```typescript
// 频道信息获取
getChannelInfo(channel: WKChannel): Promise<WKChannelInfo | null>
refreshChannelInfo(channel: WKChannel): Promise<WKChannelInfo | null>
hasChannelInfo(channel: WKChannel): boolean

// 频道信息维护
addOrUpdateChannelInfo(channelInfo: WKChannelInfo): void
addOrUpdateChannelInfos(channelInfos: WKChannelInfo[]): void
deleteChannelInfo(channel: WKChannel): void
clearAllChannelInfo(): void

// 查询功能
searchChannelInfos(keyword: string): WKChannelInfo[]
getChannelInfosByType(channelType: number): WKChannelInfo[]
getAllCachedChannelInfos(): WKChannelInfo[]

// 批量操作
preloadChannelInfos(channels: WKChannel[]): Promise<void>

// 统计信息
getCacheStats(): { total: number; byType: { [key: number]: number } }
```

#### 委托接口

```typescript
interface WKChannelManagerDelegate {
  onChannelInfoUpdate?(channelInfo: WKChannelInfo): void;
  onChannelInfoDeleted?(channel: WKChannel): void;
}
```

#### 数据提供者

```typescript
// 频道信息提供者
channelInfoProvider?: (channel: WKChannel) => Promise<WKChannelInfo | null>
```

## 数据模型

### WKChannel

表示一个频道（聊天对象）。

```typescript
class WKChannel {
  channelId: string      // 频道ID
  channelType: number    // 频道类型（1=个人，2=群组）

  // 静态方法
  static channelID(channelId: string, channelType: number): WKChannel
  static personWithChannelID(channelID: string): WKChannel    // 创建个人频道
  static groupWithChannelID(channelID: string): WKChannel     // 创建群组频道

  // 实例方法
  toMap(): { [key: string]: any }
  equals(other: WKChannel): boolean
  toString(): string

  // 静态方法
  static fromMap(dict: { [key: string]: any }): WKChannel
}
```

### WKMessage

表示一条消息。

```typescript
class WKMessage {
  // 头部信息
  header: WKMessageHeader
  setting?: WKSetting

  // 基本标识
  clientSeq: number         // 客户端序列号
  clientMsgNo: string       // 客户端消息唯一编号
  messageId: number         // 消息ID（全局唯一）
  messageSeq: number        // 消息序列号
  orderSeq: number          // 消息排序号

  // 时间信息
  timestamp: number         // 服务器时间戳
  localTimestamp: number    // 本地创建时间

  // 发送者和接收者
  fromUid: string          // 发送者UID
  toUid?: string           // 接收者UID
  from?: WKChannelInfo     // 发送者信息

  // 频道信息
  channel: WKChannel       // 所属频道
  channelInfo?: WKChannelInfo // 频道资料

  // 消息内容
  contentType: number      // 正文类型
  content?: WKMessageContent // 消息正文
  topic?: string          // 消息话题

  // 状态信息
  status: WKMessageStatus // 消息状态
  voiceReaded: boolean   // 语音是否已读
  isDeleted: boolean     // 是否被删除

  // 扩展信息
  extra: { [key: string]: any } // 本地扩展数据
  remoteExtra?: WKMessageExtra  // 远程扩展
  reactions?: WKReaction[]      // 消息回应

  // 流式消息
  streamNo?: string       // 流编号
  streamSeq: number       // 流序号
  streamFlag: WKStreamFlag // 流标记
  streams: WKStream[]     // 流内容

  // 过期信息
  expire: number          // 过期时长（秒）
  expireAt?: Date         // 过期时间

  // 方法
  isSend(): boolean       // 是否是发送消息

  // 静态方法
  static generateClientMsgNo(): string  // 生成客户端消息编号
  static generateClientSeq(): number    // 生成客户端序列号
}
```

### WKMessageContent

消息内容基类，所有具体消息类型都继承自此类。

```typescript
abstract class WKMessageContent {
  abstract contentType(): number       // 内容类型
  abstract encode(): string           // 编码为字符串
  abstract decode(content: string): void // 从字符串解码
  abstract digest(): string          // 获取消息摘要
}
```

#### 内置消息内容类型

```typescript
// 文本消息
class WKTextContent extends WKMessageContent {
  text: string
  contentType(): number { return 1; }
}

// 图片消息
class WKImageContent extends WKMessageContent {
  url: string
  localPath?: string
  width: number
  height: number
  size: number
  contentType(): number { return 2; }
}

// 语音消息
class WKVoiceContent extends WKMessageContent {
  url: string
  localPath?: string
  duration: number
  size: number
  waveform?: number[]
  contentType(): number { return 3; }
}

// 系统消息
class WKSystemContent extends WKMessageContent {
  content: string
  data?: { [key: string]: any }
  contentType(): number { return 1000; }
}

// 命令消息
class WKCMDContent extends WKMessageContent {
  cmd: string
  param?: { [key: string]: any }
  contentType(): number { return 99; }
}

// 未知消息
class WKUnknownContent extends WKMessageContent {
  data: string
  contentType(): number { return 0; }
}
```

### WKChannelInfo

频道信息类。

```typescript
class WKChannelInfo {
  channelId: string       // 频道ID
  channelType: number     // 频道类型
  name: string           // 频道名称
  avatar?: string        // 头像
  remark?: string        // 备注
  status?: number        // 状态
  extra?: { [key: string]: any } // 扩展信息

  static fromMap(data: { [key: string]: any }): WKChannelInfo
  toMap(): { [key: string]: any }
  equals(other: WKChannelInfo): boolean
}
```

## 协议定义

### WKPacket

协议包基类。

```typescript
abstract class WKPacket {
  header: WKHeader

  abstract encodeBody(): Buffer
  abstract decodeBody(buffer: Buffer): void
  encode(): Buffer
  static decode(buffer: Buffer): WKPacket
}
```

### 具体协议包类型

```typescript
class WKConnectPacket extends WKPacket     // 连接包
class WKConnackPacket extends WKPacket     // 连接确认包
class WKSendPacket extends WKPacket        // 发送包
class WKSendackPacket extends WKPacket     // 发送确认包
class WKRecvPacket extends WKPacket        // 接收包
class WKRecvackPacket extends WKPacket     // 接收确认包
class WKPingPacket extends WKPacket        // Ping包
class WKPongPacket extends WKPacket        // Pong包
class WKDisconnectPacket extends WKPacket  // 断开连接包
```

## 配置选项

### WKOptions

SDK配置选项类。

```typescript
class WKOptions {
  // 连接配置
  host?: string                    // 服务器地址
  port?: number                   // 服务器端口
  connectInfo?: WKConnectInfo     // 连接信息
  isDebug: boolean               // 调试模式

  // 超时配置
  connectTimeout: number         // 连接超时时间
  pingInterval: number          // Ping间隔
  reconnectInterval: number     // 重连间隔
  maxReconnectAttempts: number  // 最大重连次数

  // 消息配置
  messageRetryCount: number     // 消息重试次数
  messageTimeout: number        // 消息超时时间
  maxMessageSize: number        // 最大消息大小

  // 缓存配置
  enableMessageCache: boolean      // 启用消息缓存
  maxCachedMessages: number       // 最大缓存消息数
  enableChannelInfoCache: boolean // 启用频道信息缓存
  maxCachedChannelInfos: number   // 最大缓存频道信息数

  // 安全配置
  enableEncryption: boolean       // 启用加密
  encryptionKey?: string         // 加密密钥

  // 日志配置
  logLevel: 'error' | 'warn' | 'info' | 'debug' // 日志级别
  enableFileLog: boolean         // 启用文件日志
  logFilePath?: string          // 日志文件路径

  // 方法
  validate(): string[]           // 验证配置
  static createDefault(): WKOptions // 创建默认配置
  static fromJSON(json: any): WKOptions // 从JSON创建
  toJSON(): any                 // 转换为JSON
}
```

## 类型定义

### 连接信息

```typescript
interface WKConnectInfo {
  uid: string      // 用户ID
  token: string    // 连接token
  name?: string    // 用户名
  avatar?: string  // 头像
}
```

### 枚举类型

```typescript
enum WKConnectStatus {
  NoConnect = 0,      // 未连接
  Connecting = 1,     // 连接中
  PullingOffline = 2, // 拉取离线中
  Connected = 3,      // 已建立连接
  Disconnected = 4,   // 断开连接
}

enum WKMessageStatus {
  Normal = 0,      // 正常
  Sending = 1,     // 发送中
  Success = 2,     // 发送成功
  Fail = 3,        // 发送失败
}

enum WKReason {
  SystemError = 0,
  ConnectError = 1,
  ConnectTimeout = 2,
  ConnectKick = 3,
  TokenExpired = 4,
  TokenError = 5,
  BanNetwork = 6,
  Unknown = 999,
}

enum WKStreamFlag {
  Start = 0,   // 开始
  Ing = 1,     // 进行中
  End = 2,     // 结束
}
```