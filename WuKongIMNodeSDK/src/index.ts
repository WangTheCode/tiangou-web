// 核心SDK
export { WKSDK } from './core/WKSDK';
export { WKOptions } from './core/WKOptions';
export { WKTransport, WKTCPTransport, WKWebSocketTransport } from './core/WKTransport';

// 管理器
export { WKConnectionManager, WKTransportType } from './managers/WKConnectionManager';
export { WKChatManager } from './managers/WKChatManager';
export { WKChannelManager } from './managers/WKChannelManager';

// 模型
export { WKChannel } from './models/WKChannel';
export { WKMessage, WKMessageHeader, WKSetting, WKMessageExtra, WKReaction, WKStream } from './models/WKMessage';
export {
  WKMessageContent,
  WKTextContent,
  WKImageContent,
  WKVoiceContent,
  WKSystemContent,
  WKCMDContent,
  WKUnknownContent
} from './models/WKMessageContent';
export { WKChannelInfo } from './models/WKChannelInfo';

// 协议
export {
  WKPacket,
  WKHeader,
  WKConnectPacket,
  WKConnackPacket,
  WKSendPacket,
  WKSendackPacket,
  WKRecvPacket,
  WKRecvackPacket,
  WKPingPacket,
  WKPongPacket,
  WKDisconnectPacket
} from './protocols/WKPacket';

// 类型定义
export {
  WKConnectStatus,
  WKMessageStatus,
  WKReason,
  WKPacketType,
  WKStreamFlag,
  WKPullMode,
  WKConnectionManagerDelegate,
  WKChatManagerDelegate,
  WKConnectInfo
} from './types';

// 默认导出主SDK类
export { WKSDK as default } from './core/WKSDK';