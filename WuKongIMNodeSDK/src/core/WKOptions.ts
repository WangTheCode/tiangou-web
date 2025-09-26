import { WKConnectInfo } from '../types';

export class WKOptions {
  public host?: string;                  // 服务器地址
  public port?: number;                  // 服务器端口
  public isDebug: boolean = false;       // 是否调试模式
  public connectInfo?: WKConnectInfo;    // 连接信息
  public transportType: 'tcp' | 'websocket' = 'tcp'; // 传输类型

  // 连接相关配置
  public connectTimeout: number = 30000;     // 连接超时时间(毫秒)
  public pingInterval: number = 30000;       // ping间隔时间(毫秒)
  public reconnectInterval: number = 5000;   // 重连间隔时间(毫秒)
  public maxReconnectAttempts: number = 10;  // 最大重连次数

  // 消息相关配置
  public messageRetryCount: number = 3;      // 消息重试次数
  public messageTimeout: number = 30000;     // 消息发送超时时间(毫秒)
  public maxMessageSize: number = 1024 * 1024; // 最大消息大小(字节)

  // 缓存相关配置
  public enableMessageCache: boolean = true;    // 是否启用消息缓存
  public maxCachedMessages: number = 10000;     // 最大缓存消息数
  public enableChannelInfoCache: boolean = true; // 是否启用频道信息缓存
  public maxCachedChannelInfos: number = 1000;  // 最大缓存频道信息数

  // 安全相关配置
  public enableEncryption: boolean = false;     // 是否启用加密
  public encryptionKey?: string;                 // 加密密钥

  // 日志相关配置
  public logLevel: 'error' | 'warn' | 'info' | 'debug' = 'info'; // 日志级别
  public enableFileLog: boolean = false;        // 是否启用文件日志
  public logFilePath?: string;                   // 日志文件路径

  constructor(options?: Partial<WKOptions>) {
    if (options) {
      Object.assign(this, options);
    }
  }

  // 验证配置是否有效
  validate(): string[] {
    const errors: string[] = [];

    if (!this.host) {
      errors.push('Host is required');
    }

    if (!this.port || this.port <= 0 || this.port > 65535) {
      errors.push('Valid port is required');
    }

    if (!this.connectInfo) {
      errors.push('Connect info is required');
    } else {
      if (!this.connectInfo.uid) {
        errors.push('UID is required');
      }
      if (!this.connectInfo.token) {
        errors.push('Token is required');
      }
    }

    if (this.connectTimeout <= 0) {
      errors.push('Connect timeout must be positive');
    }

    if (this.pingInterval <= 0) {
      errors.push('Ping interval must be positive');
    }

    if (this.reconnectInterval <= 0) {
      errors.push('Reconnect interval must be positive');
    }

    if (this.maxReconnectAttempts < 0) {
      errors.push('Max reconnect attempts must be non-negative');
    }

    if (this.messageRetryCount < 0) {
      errors.push('Message retry count must be non-negative');
    }

    if (this.messageTimeout <= 0) {
      errors.push('Message timeout must be positive');
    }

    if (this.maxMessageSize <= 0) {
      errors.push('Max message size must be positive');
    }

    if (this.maxCachedMessages < 0) {
      errors.push('Max cached messages must be non-negative');
    }

    if (this.maxCachedChannelInfos < 0) {
      errors.push('Max cached channel infos must be non-negative');
    }

    return errors;
  }

  // 应用默认配置
  static createDefault(): WKOptions {
    return new WKOptions({
      isDebug: false,
      connectTimeout: 30000,
      pingInterval: 30000,
      reconnectInterval: 5000,
      maxReconnectAttempts: 10,
      messageRetryCount: 3,
      messageTimeout: 30000,
      maxMessageSize: 1024 * 1024,
      enableMessageCache: true,
      maxCachedMessages: 10000,
      enableChannelInfoCache: true,
      maxCachedChannelInfos: 1000,
      enableEncryption: false,
      logLevel: 'info',
      enableFileLog: false,
    });
  }

  // 从JSON对象创建配置
  static fromJSON(json: any): WKOptions {
    const options = new WKOptions();

    if (json.host) options.host = json.host;
    if (json.port) options.port = json.port;
    if (json.isDebug !== undefined) options.isDebug = json.isDebug;
    if (json.connectInfo) {
      options.connectInfo = {
        uid: json.connectInfo.uid,
        token: json.connectInfo.token,
        name: json.connectInfo.name,
        avatar: json.connectInfo.avatar,
      };
    }

    // 连接相关配置
    if (json.connectTimeout) options.connectTimeout = json.connectTimeout;
    if (json.pingInterval) options.pingInterval = json.pingInterval;
    if (json.reconnectInterval) options.reconnectInterval = json.reconnectInterval;
    if (json.maxReconnectAttempts) options.maxReconnectAttempts = json.maxReconnectAttempts;

    // 消息相关配置
    if (json.messageRetryCount) options.messageRetryCount = json.messageRetryCount;
    if (json.messageTimeout) options.messageTimeout = json.messageTimeout;
    if (json.maxMessageSize) options.maxMessageSize = json.maxMessageSize;

    // 缓存相关配置
    if (json.enableMessageCache !== undefined) options.enableMessageCache = json.enableMessageCache;
    if (json.maxCachedMessages) options.maxCachedMessages = json.maxCachedMessages;
    if (json.enableChannelInfoCache !== undefined) options.enableChannelInfoCache = json.enableChannelInfoCache;
    if (json.maxCachedChannelInfos) options.maxCachedChannelInfos = json.maxCachedChannelInfos;

    // 安全相关配置
    if (json.enableEncryption !== undefined) options.enableEncryption = json.enableEncryption;
    if (json.encryptionKey) options.encryptionKey = json.encryptionKey;

    // 日志相关配置
    if (json.logLevel) options.logLevel = json.logLevel;
    if (json.enableFileLog !== undefined) options.enableFileLog = json.enableFileLog;
    if (json.logFilePath) options.logFilePath = json.logFilePath;

    return options;
  }

  // 转换为JSON对象
  toJSON(): any {
    return {
      host: this.host,
      port: this.port,
      isDebug: this.isDebug,
      connectInfo: this.connectInfo,
      connectTimeout: this.connectTimeout,
      pingInterval: this.pingInterval,
      reconnectInterval: this.reconnectInterval,
      maxReconnectAttempts: this.maxReconnectAttempts,
      messageRetryCount: this.messageRetryCount,
      messageTimeout: this.messageTimeout,
      maxMessageSize: this.maxMessageSize,
      enableMessageCache: this.enableMessageCache,
      maxCachedMessages: this.maxCachedMessages,
      enableChannelInfoCache: this.enableChannelInfoCache,
      maxCachedChannelInfos: this.maxCachedChannelInfos,
      enableEncryption: this.enableEncryption,
      encryptionKey: this.encryptionKey,
      logLevel: this.logLevel,
      enableFileLog: this.enableFileLog,
      logFilePath: this.logFilePath,
    };
  }

  // 克隆配置对象
  clone(): WKOptions {
    return new WKOptions(this.toJSON());
  }

  // 合并其他配置
  merge(other: Partial<WKOptions>): WKOptions {
    return new WKOptions({ ...this.toJSON(), ...other });
  }
}