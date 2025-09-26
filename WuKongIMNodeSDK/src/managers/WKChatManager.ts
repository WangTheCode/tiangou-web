import { EventEmitter } from 'events';
import { WKChatManagerDelegate } from '../types';
import { WKMessage, WKSetting } from '../models/WKMessage';
import { WKMessageContent, WKTextContent, WKUnknownContent } from '../models/WKMessageContent';
import { WKChannel } from '../models/WKChannel';
import { WKSendPacket } from '../protocols/WKPacket';
import { WKConnectionManager } from './WKConnectionManager';
import { PacketType, RecvPacket, SendackPacket, RecvackPacket } from '../protocols/proto';
import { Md5 } from 'md5-typescript';
import { SecurityManager } from '../protocols/security';

export class WKChatManager extends EventEmitter {
  private delegates: Set<WKChatManagerDelegate> = new Set();
  private connectionManager: WKConnectionManager;
  private messageStoreInterceptors: Map<string, (message: WKMessage) => boolean> = new Map();

  // 数据提供者回调
  public syncChannelMessageProvider?: (channel: WKChannel, startMessageSeq: number, endMessageSeq: number, limit: number, pullMode: number) => Promise<WKMessage[]>;
  public syncMessageExtraProvider?: (channel: WKChannel, messageIds: number[]) => Promise<any[]>;
  public updateMessageExtraProvider?: (message: WKMessage, extra: any) => Promise<void>;
  public messageEditProvider?: (message: WKMessage, newContent: WKMessageContent) => Promise<WKMessage>;

  constructor() {
    super();
    this.connectionManager = WKConnectionManager.sharedManager();
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    this.connectionManager.on('packet', (packet: any) => {
      this.handlePacket(packet);
    });
  }

  private handlePacket(packet: any): void {
    switch (packet.packetType) {
      case PacketType.RECV:
        this.handleRecvPacket(packet as RecvPacket);
        break;
      case PacketType.SENDACK:
        this.handleSendackPacket(packet as SendackPacket);
        break;
      case PacketType.Event:
        // 处理事件包
        // 处理事件包 - 暂时只记录
        console.log('📥 收到事件包:', packet);
        break;
    }
  }

  private handleSendackPacket(packet: SendackPacket): void {
    this.delegates.forEach(delegate => {
      delegate.onSendack?.(packet, 0);
    });
  }

  private async handleRecvPacket(recvPacket: RecvPacket): Promise<void> {
    try {
      // 验证消息合法性
      const actMsgKey = SecurityManager.shared().encryption(recvPacket.veritifyString);
      const actMsgKeyMD5 = Md5.init(actMsgKey);
      if (actMsgKeyMD5 !== recvPacket.msgKey) {
        console.log(`非法的消息，期望msgKey:${recvPacket.msgKey} 实际msgKey:${actMsgKeyMD5} 忽略此消息！！`);
        return;
      }

      // 解密消息内容
      recvPacket.payload = SecurityManager.shared().decryption(recvPacket.payload);
      
      console.log("消息内容-->", recvPacket);

      // 转换为WKMessage对象
      const message = this.parseRecvPacketToMessage(recvPacket);
      if (message && this.needStoreOfIntercept(message)) {
        // 发送接收确认
        this.sendRecvackPacket(recvPacket);
        
        // 通知消息监听者
        this.notifyRecvMessages(message, 0);
      }
    } catch (error) {
      console.error('处理接收消息包失败:', error);
    }
  }

  private parseRecvPacketToMessage(recvPacket: RecvPacket): WKMessage | null {
    try {
      const message = new WKMessage();
      message.messageId = parseInt(recvPacket.messageID) || 0;
      message.messageSeq = recvPacket.messageSeq;
      message.clientMsgNo = recvPacket.clientMsgNo;
      message.timestamp = recvPacket.timestamp;
      message.fromUid = recvPacket.fromUID;
      message.channel = WKChannel.channelID(recvPacket.channelID, recvPacket.channelType);
      message.topic = recvPacket.topic;
      
      // 解析消息内容
      try {
        const payloadStr = new TextDecoder('utf-8').decode(recvPacket.payload);
        const contentData = JSON.parse(payloadStr);
        
        message.contentType = contentData.type || 1;
        
        // 根据内容类型创建对应的WKMessageContent
        if (contentData.type === 1) {
          // 文本消息
          const textContent = new WKTextContent();
          textContent.text = contentData.content || '';
          message.content = textContent;
        } else {
          // 其他类型消息，暂时使用未知内容
          const unknownContent = new WKUnknownContent();
          unknownContent.decode(contentData.content || '');
          message.content = unknownContent;
        }
      } catch (parseError) {
        console.error('解析消息内容失败:', parseError);
        // 创建未知内容
        const unknownContent = new WKUnknownContent();
        unknownContent.decode('解析失败的消息');
        message.content = unknownContent;
        message.contentType = 0;
      }
      
      return message;
    } catch (error) {
      console.error('解析RecvPacket为WKMessage失败:', error);
      return null;
    }
  }

  private sendRecvackPacket(recvPacket: RecvPacket): void {
    const packet = new RecvackPacket();
    packet.messageID = recvPacket.messageID;
    packet.messageSeq = recvPacket.messageSeq;
    this.connectionManager.sendPacket(packet);
  }

  // 发送消息（重载）
  sendMessage(content: WKMessageContent, channel: WKChannel, setting?: WKSetting, topic?: string): WKMessage;
  sendMessage(message: WKMessage, addRetryQueue?: boolean): WKMessage;
  sendMessage(
    arg1: WKMessageContent | WKMessage,
    arg2?: WKChannel | boolean,
    arg3?: WKSetting,
    arg4?: string
  ): WKMessage {
    let message: WKMessage;
    let addRetryQueue = true;

    if (arg1 instanceof WKMessage) {
      // 处理 sendMessage(message, addRetryQueue)
      message = arg1;
      addRetryQueue = typeof arg2 === 'boolean' ? arg2 : true;
    } else {
      // 处理 sendMessage(content, channel, setting?, topic?)
      message = this.contentToMessage(arg1, arg2 as WKChannel);
      if (arg3) {
        message.setting = arg3;
      }
      if (arg4) {
        message.topic = arg4;
      }
    }

    // 设置消息基本信息
    message.clientSeq = WKMessage.generateClientSeq();
    message.clientMsgNo = WKMessage.generateClientMsgNo();
    message.localTimestamp = Date.now();

    // 构建发送包
    const sendPacket = this.buildSendPacket(message);

    // 发送消息
    this.connectionManager.sendPacket(sendPacket);

    // 如果需要添加到重试队列，这里可以实现重试逻辑
    if (addRetryQueue) {
      // 实现重试队列逻辑
    }

    // 通知消息更新
    this.notifyMessageUpdate(message, 0);

    return message;
  }

  private buildSendPacket(message: WKMessage): WKSendPacket {
    const sendPacket = new WKSendPacket();

    // 设置基本信息
    sendPacket.clientSeq = message.clientSeq;
    sendPacket.clientMsgNo = message.clientMsgNo;
    sendPacket.channelID = message.channel.channelId;
    sendPacket.channelType = message.channel.channelType;
    sendPacket.clientTimestamp = Math.floor(message.localTimestamp / 1000);

    if (message.topic) {
      sendPacket.topic = message.topic;
    }

    if (message.setting) {
      // 根据setting设置flag
      let setting = 0;
      if (message.setting.receipt) setting |= 0x01;
      if (message.setting.signal) setting |= 0x02;
      if (message.setting.stream) setting |= 0x04;
      sendPacket.setting = setting;
    }

    // 设置payload
    if (message.content) {
      const contentData = Buffer.from(message.content.encode(), 'utf8');
      sendPacket.payload = contentData;
    }

    return sendPacket;
  }

  // 重发消息
  resendMessage(message: WKMessage): WKMessage {
    return this.sendMessage(message, true);
  }

  // 保存消息
  saveMessage(content: WKMessageContent, channel: WKChannel, fromUid?: string, status = 0): WKMessage {
    const message = this.contentToMessage(content, channel, fromUid);
    // 这里应该保存到本地数据库
    // 目前只是创建消息对象
    return message;
  }

  // 保存多条消息
  saveMessages(messages: WKMessage[]): WKMessage[] {
    // 批量保存消息到本地数据库
    // 这里只是返回消息数组
    return messages;
  }

  // 添加或更新消息
  addOrUpdateMessages(messages: WKMessage[], notify: boolean = true): void {
    // 实现消息的添加或更新逻辑
    if (notify) {
      messages.forEach(message => {
        this.notifyMessageUpdate(message, 0);
      });
    }
  }

  // 转发消息
  forwardMessage(content: WKMessageContent, channel: WKChannel): WKMessage {
    return this.sendMessage(content, channel);
  }

  // 编辑消息
  async editMessage(message: WKMessage, newContent: WKMessageContent): Promise<WKMessage> {
    if (this.messageEditProvider) {
      return await this.messageEditProvider(message, newContent);
    }

    // 默认实现：更新本地消息内容
    message.content = newContent;
    this.notifyMessageUpdate(message, 0);
    return message;
  }

  // 删除消息（重载）
  deleteMessage(message: WKMessage): void;
  deleteMessage(fromUID: string, channel: WKChannel): void;
  deleteMessage(arg1: WKMessage | string, arg2?: WKChannel): void {
    if (typeof arg1 !== 'string') {
      // deleteMessage(message)
      const message = arg1 as WKMessage;
      message.isDeleted = true;
      this.delegates.forEach(delegate => {
        delegate.onMessageDeleted?.(message);
      });
    } else {
      // deleteMessage(fromUID, channel)
      // 实现批量删除逻辑（占位）
    }
  }

  // 清除指定频道的消息
  clearMessages(channel: WKChannel): void {
    this.delegates.forEach(delegate => {
      delegate.onMessageCleared?.(channel);
    });
  }

  // 清除所有消息
  clearAllMessages(): void {
    this.delegates.forEach(delegate => {
      delegate.onMessageAllCleared?.();
    });
  }

  // 清除指定messageSeq之前的消息
  clearFromMsgSeq(channel: WKChannel, maxMsgSeq: number, isContain: boolean): void {
    // 实现清除逻辑
  }

  // 拉取最新消息
  async pullLastMessages(
    channel: WKChannel,
    endOrderSeq: number = 0,
    maxMessageSeq: number = 0,
    limit: number = 20
  ): Promise<WKMessage[]> {
    if (this.syncChannelMessageProvider) {
      return await this.syncChannelMessageProvider(channel, 0, maxMessageSeq, limit, 0);
    }
    return [];
  }

  // 下拉加载消息
  async pullDown(channel: WKChannel, startOrderSeq: number, limit: number): Promise<WKMessage[]> {
    if (this.syncChannelMessageProvider) {
      return await this.syncChannelMessageProvider(channel, startOrderSeq, 0, limit, 0);
    }
    return [];
  }

  // 上拉加载消息
  async pullUp(
    channel: WKChannel,
    startOrderSeq: number,
    endOrderSeq: number = 0,
    limit: number = 20
  ): Promise<WKMessage[]> {
    if (this.syncChannelMessageProvider) {
      return await this.syncChannelMessageProvider(channel, startOrderSeq, endOrderSeq, limit, 1);
    }
    return [];
  }

  // 查询周围消息
  async pullAround(
    channel: WKChannel,
    orderSeq: number,
    maxMessageSeq: number = 0,
    limit: number = 20
  ): Promise<WKMessage[]> {
    if (this.syncChannelMessageProvider) {
      const half = Math.floor(limit / 2);
      return await this.syncChannelMessageProvider(channel, orderSeq - half, orderSeq + half, limit, 2);
    }
    return [];
  }

  // 更新语音消息已读状态
  updateMessageVoiceReaded(message: WKMessage): void {
    message.voiceReaded = true;
    this.notifyMessageUpdate(message, 0);
  }

  // 更新本地扩展数据
  updateMessageLocalExtra(message: WKMessage): void {
    this.notifyMessageUpdate(message, 0);
  }

  // 更新消息远程扩展
  async updateMessageRemoteExtra(message: WKMessage): Promise<void> {
    if (this.updateMessageExtraProvider && message.remoteExtra) {
      await this.updateMessageExtraProvider(message, message.remoteExtra);
    }
  }

  // 撤回消息
  revokeMessage(message: WKMessage): void {
    // 发送撤回消息的命令
    // 这里需要实现撤回逻辑
    message.isDeleted = true;
    this.notifyMessageUpdate(message, 0);
  }

  // 获取orderSeq
  getOrderSeq(messageSeq: number): number {
    // 实现orderSeq的获取逻辑
    return messageSeq;
  }

  // 获取messageSeq
  getMessageSeq(orderSeq: number): number {
    // 实现messageSeq的获取逻辑
    return orderSeq;
  }

  // 获取最接近orderSeq的有效orderSeq
  getOrNearbyMessageSeq(orderSeq: number): number {
    // 实现获取附近有效orderSeq的逻辑
    return orderSeq;
  }

  // 正文包装为消息
  contentToMessage(content: WKMessageContent, channel: WKChannel, fromUid?: string): WKMessage {
    const message = new WKMessage();
    message.content = content;
    message.contentType = content.contentType();
    message.channel = channel;
    message.fromUid = fromUid || this.getSelfUID();
    message.localTimestamp = Date.now();
    return message;
  }

  // 通过正文类型获取content实例
  getMessageContent(contentType: number): WKMessageContent | null {
    // 这里应该根据contentType返回对应的content实例
    // 需要在SDK中注册各种content类型
    return null;
  }

  // 获取某个频道内最新的消息
  getLastMessage(channel: WKChannel): WKMessage | null {
    // 从本地数据库获取最新消息
    return null;
  }

  // 同步消息的扩展数据
  async syncMessageExtra(channel: WKChannel): Promise<void> {
    if (this.syncMessageExtraProvider) {
      // 获取需要同步的消息ID列表
      const messageIds: number[] = [];
      await this.syncMessageExtraProvider(channel, messageIds);
    }
  }

  // 添加委托
  addDelegate(delegate: WKChatManagerDelegate): void {
    this.delegates.add(delegate);
  }

  // 移除委托
  removeDelegate(delegate: WKChatManagerDelegate): void {
    this.delegates.delete(delegate);
  }

  // 添加消息存储拦截器
  addMessageStoreBeforeIntercept(sid: string, intercept: (message: WKMessage) => boolean): void {
    this.messageStoreInterceptors.set(sid, intercept);
  }

  // 移除消息存储拦截器
  removeMessageStoreBeforeIntercept(sid: string): void {
    this.messageStoreInterceptors.delete(sid);
  }

  // 检查消息是否需要存储
  needStoreOfIntercept(message: WKMessage): boolean {
    for (const [sid, intercept] of this.messageStoreInterceptors) {
      if (!intercept(message)) {
        return false;
      }
    }
    return true;
  }

  // 通知收到消息
  private notifyRecvMessages(message: WKMessage, left: number): void {
    this.delegates.forEach(delegate => {
      delegate.onRecvMessages?.(message, left);
    });
  }

  // 通知消息更新
  private notifyMessageUpdate(message: WKMessage, left: number, total?: number): void {
    this.delegates.forEach(delegate => {
      if (total !== undefined) {
        delegate.onMessageUpdate?.(message, left, total);
      } else {
        delegate.onMessageUpdate?.(message, left);
      }
    });
  }

  // 调用消息更新委托
  callMessageUpdateDelegate(message: WKMessage, left: number = 0, total: number = 1): void {
    this.notifyMessageUpdate(message, left, total);
  }

  // 调用收到消息委托
  callRecvMessagesDelegate(messages: WKMessage[]): void {
    messages.forEach((message, index) => {
      const left = messages.length - index - 1;
      this.notifyRecvMessages(message, left);
    });
  }

  private getSelfUID(): string {
    // 从连接信息中获取当前用户UID
    // 这里需要实现获取逻辑
    return '';
  }
}