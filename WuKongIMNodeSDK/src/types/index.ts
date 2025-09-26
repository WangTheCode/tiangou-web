export enum WKConnectStatus {
  NoConnect = 0,     // 未连接
  Connecting = 1,    // 连接中
  PullingOffline = 2, // 拉取离线中
  Connected = 3,     // 已建立连接
  Disconnected = 4,  // 断开连接
}

export enum WKMessageStatus {
  Normal = 0,      // 正常
  Sending = 1,     // 发送中
  Success = 2,     // 发送成功
  Fail = 3,        // 发送失败
}

export enum WKReason {
  SystemError = 0,
  ConnectError = 1,
  ConnectTimeout = 2,
  ConnectKick = 3,
  TokenExpired = 4,
  TokenError = 5,
  BanNetwork = 6,
  Unknown = 999,
}

export enum WKPacketType {
  Connect = 1,     // 连接包
  Connack = 2,     // 连接确认包
  Send = 3,        // 发送包
  Sendack = 4,     // 发送确认包
  Recv = 5,        // 接收包
  Recvack = 6,     // 接收确认包
  Ping = 7,        // ping包
  Pong = 8,        // pong包
  Disconnect = 9,  // 断开连接包
}

export enum WKStreamFlag {
  Start = 0,   // 开始
  Ing = 1,     // 进行中
  End = 2,     // 结束
}

export enum WKPullMode {
  Down = 0,    // 下拉
  Up = 1,      // 上拉
}

// 回调类型定义
export type WKConnectionStatusCallback = (status: WKConnectStatus, reasonCode: WKReason) => void;
export type WKKickCallback = (reasonCode: number, reason: string) => void;
export type WKMessageCallback = (message: any, left: number) => void;
export type WKSendackCallback = (sendackPacket: any, left: number) => void;
export type WKChannelInfoCallback = (error?: Error, notifyBefore?: boolean) => void;
export type WKOfflineMessageCallback = (messages?: any[], more?: boolean, error?: Error) => void;
export type WKOfflineMessageAck = (messageSeq: number, complete: (error?: Error) => void) => void;
export type WKOfflineMessagePull = (limit: number, messageSeq: number, callback: WKOfflineMessageCallback) => void;
export type WKChannelInfoUpdate = (channel: any, callback: WKChannelInfoCallback) => any;

// 协议接口
export interface WKConnectionManagerDelegate {
  onConnectStatus?: WKConnectionStatusCallback;
  onKick?: WKKickCallback;
}

export interface WKChatManagerDelegate {
  onRecvMessages?: WKMessageCallback;
  onMessageUpdate?: (message: any, left: number, total?: number) => void;
  onSendack?: WKSendackCallback;
  onMessageDeleted?: (message: any) => void;
  onMessageCleared?: (channel: any) => void;
  onMessageAllCleared?: () => void;
  onMessageStream?: (stream: any) => void;
}

// 基础配置类型
export interface WKConnectInfo {
  uid: string;
  token: string;
  name?: string;
  avatar?: string;
}

export interface WKOptions {
  host?: string;
  port?: number;
  isDebug?: boolean;
  connectInfo?: WKConnectInfo;
  transportType?: 'tcp' | 'websocket';
}