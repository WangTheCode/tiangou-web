import { WKOptions } from './WKOptions';
import { WKConnectionManager, WKTransportType } from '../managers/WKConnectionManager';
import { WKChatManager } from '../managers/WKChatManager';
import { WKChannelManager } from '../managers/WKChannelManager';
import { WKMessageContent, WKTextContent, WKImageContent, WKVoiceContent, WKSystemContent, WKCMDContent, WKUnknownContent } from '../models/WKMessageContent';
import { WKConnectInfo, WKOfflineMessagePull, WKOfflineMessageAck } from '../types';

export class WKSDK {
  private static _instance: WKSDK;

  public options: WKOptions;
  private _connectURL?: string;

  // 管理器
  public connectionManager: WKConnectionManager;
  public chatManager: WKChatManager;
  public channelManager: WKChannelManager;

  // 消息内容注册表
  private messageContentRegistry: Map<number, new() => WKMessageContent> = new Map();

  // 离线消息处理
  private _offlineMessagePull?: WKOfflineMessagePull;
  private _offlineMessageAck?: WKOfflineMessageAck;

  // 频道信息更新回调
  public channelInfoUpdate?: (channel: any, callback: any) => any;

  private constructor() {
    this.options = WKOptions.createDefault();
    this.connectionManager = WKConnectionManager.sharedManager();
    this.chatManager = new WKChatManager();
    this.channelManager = new WKChannelManager();

    this.registerDefaultMessageContents();
    this.connectionManager.setOptions(this.options);
  }

  static shared(): WKSDK {
    if (!WKSDK._instance) {
      WKSDK._instance = new WKSDK();
    }
    return WKSDK._instance;
  }

  // 连接URL设置
  get connectURL(): string | undefined {
    return this._connectURL;
  }

  set connectURL(url: string | undefined) {
    if (!url) return;

    this._connectURL = url;
    this.parseConnectURL(url);
  }

  private parseConnectURL(url: string): void {
    try {
      const urlObj = new URL(url);

      // 根据协议确定传输类型
      if (urlObj.protocol === 'ws:' || urlObj.protocol === 'wss:') {
        this.options.transportType = 'websocket';
        this.options.host = urlObj.hostname;
        this.options.port = parseInt(urlObj.port) || (urlObj.protocol === 'wss:' ? 443 : 80);
      } else if (urlObj.protocol === 'tcp:') {
        this.options.transportType = 'tcp';
        this.options.host = urlObj.hostname;
        this.options.port = parseInt(urlObj.port) || 5001;
      } else {
        // 默认协议，尝试解析为 host:port 格式
        const parts = url.split(':');
        if (parts.length >= 2) {
          this.options.transportType = 'tcp';
          this.options.host = parts[0];
          this.options.port = parseInt(parts[1]) || 5001;
        }
      }

      // 解析查询参数
      const params = urlObj.searchParams;
      const uid = params.get('uid');
      const token = params.get('token');
      const name = params.get('name');
      const avatar = params.get('avatar');

      if (uid && token) {
        this.options.connectInfo = {
          uid,
          token,
          name: name || undefined,
          avatar: avatar || undefined,
        };
      }

      // 设置传输类型并更新连接管理器的配置
      this.connectionManager.setTransportType(
        this.options.transportType === 'websocket' ? WKTransportType.WebSocket : WKTransportType.TCP
      );
      this.connectionManager.setOptions(this.options);
    } catch (error) {
      console.error('Failed to parse connect URL:', error);
    }
  }

  // 是否调试模式
  isDebug(): boolean {
    return this.options.isDebug;
  }

  // SDK版本
  get sdkVersion(): string {
    return '1.0.0';
  }

  // 注册默认消息内容类型
  private registerDefaultMessageContents(): void {
    this.registerMessageContent(WKTextContent, 1);
    this.registerMessageContent(WKImageContent, 2);
    this.registerMessageContent(WKVoiceContent, 3);
    this.registerMessageContent(WKCMDContent, 99);
    this.registerMessageContent(WKSystemContent, 1000);
  }

  // 注册消息正文类型
  registerMessageContent(contentClass: new() => WKMessageContent, contentType?: number): void {
    const instance = new contentClass();
    const type = contentType || instance.contentType();
    this.messageContentRegistry.set(type, contentClass);
  }

  // 获取消息正文类型对应的类
  getMessageContent(contentType: number): new() => WKMessageContent {
    const ContentClass = this.messageContentRegistry.get(contentType);

    if (ContentClass) {
      return ContentClass;
    }

    // 系统消息
    if (this.isSystemMessage(contentType)) {
      return WKSystemContent;
    }

    // 未知消息类型
    return WKUnknownContent;
  }

  // 创建消息内容实例
  createMessageContent(contentType: number): WKMessageContent {
    const ContentClass = this.getMessageContent(contentType);
    return new ContentClass();
  }

  // 是否是系统消息
  isSystemMessage(contentType: number): boolean {
    return contentType >= 1000 && contentType <= 2000;
  }

  // 设置离线消息提供者
  setOfflineMessageProvider(
    offlineMessagePull: WKOfflineMessagePull,
    offlineMessageAck: WKOfflineMessageAck
  ): void {
    this._offlineMessagePull = offlineMessagePull;
    this._offlineMessageAck = offlineMessageAck;
  }

  // 获取离线消息拉取回调
  get offlineMessagePull(): WKOfflineMessagePull | undefined {
    return this._offlineMessagePull;
  }

  // 获取离线消息确认回调
  get offlineMessageAck(): WKOfflineMessageAck | undefined {
    return this._offlineMessageAck;
  }

  // 获取消息文件上传任务
  getMessageFileUploadTask(message: any): any {
    // 这里需要实现文件上传任务管理
    return null;
  }

  // 获取消息文件下载任务
  getMessageDownloadTask(message: any): any {
    // 这里需要实现文件下载任务管理
    return null;
  }

  // 启动SDK
  start(): void {
    // 验证配置
    const errors = this.options.validate();
    if (errors.length > 0) {
      throw new Error(`SDK configuration errors: ${errors.join(', ')}`);
    }

    // 启动连接
    this.connectionManager.connect();
  }

  // 停止SDK
  stop(): void {
    this.connectionManager.disconnect(true);
  }

  // 重启SDK
  restart(): void {
    this.stop();
    setTimeout(() => {
      this.start();
    }, 1000);
  }

  // 获取SDK状态信息
  getStatus(): {
    version: string;
    connectStatus: number;
    isDebug: boolean;
    registeredContentTypes: number[];
    cacheStats: any;
  } {
    return {
      version: this.sdkVersion,
      connectStatus: this.connectionManager.connectStatus,
      isDebug: this.isDebug(),
      registeredContentTypes: Array.from(this.messageContentRegistry.keys()),
      cacheStats: this.channelManager.getCacheStats(),
    };
  }

  // 清理资源
  cleanup(): void {
    this.connectionManager.disconnect(true);
    this.channelManager.clearAllChannelInfo();
    this.messageContentRegistry.clear();
  }

  // 重置SDK到初始状态
  reset(): void {
    this.cleanup();
    this.options = WKOptions.createDefault();
    this.registerDefaultMessageContents();
    this._connectURL = undefined;
    this._offlineMessagePull = undefined;
    this._offlineMessageAck = undefined;
  }

  // 从配置文件加载选项
  loadOptionsFromConfig(config: any): void {
    this.options = WKOptions.fromJSON(config);
    this.connectionManager.setOptions(this.options);
  }

  // 导出当前配置
  exportConfig(): any {
    return this.options.toJSON();
  }
}