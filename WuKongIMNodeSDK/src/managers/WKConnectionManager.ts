import { EventEmitter } from 'events';
import { WKConnectStatus, WKReason, WKConnectionManagerDelegate } from '../types';
import { WKConnectPacket, WKPingPacket, WKPacket } from '../protocols/WKPacket';
import { WKOptions } from '../core/WKOptions';
import { WKTransport, WKTCPTransport, WKWebSocketTransport } from '../core/WKTransport';
import {Guid} from '../utils/guid';
import { generateKeyPair, sharedKey } from 'curve25519-js';
import Proto, { IProto, ConnectPacket, PacketType, PingPacket } from '../protocols/proto';
import { SecurityManager } from '../protocols/security';
import { Md5 } from 'md5-typescript';

import * as buffer from "buffer"

export enum WKTransportType {
  TCP = 'tcp',
  WebSocket = 'websocket',
}

export class WKConnectionManager extends EventEmitter {
  private static _instance: WKConnectionManager;
  private transport?: WKTransport;
  private _connectStatus: WKConnectStatus = WKConnectStatus.NoConnect;
  private delegates: Set<WKConnectionManagerDelegate> = new Set();
  private pingInterval?: NodeJS.Timeout;
  private reconnectTimeout?: NodeJS.Timeout;
  private isForceDisconnect: boolean = false;
  private reconnectCount: number = 0;
  private maxReconnectCount: number = 10;
  private options?: WKOptions;
  private transportType: WKTransportType = WKTransportType.TCP;

  // 数据缓冲区管理
  private tempBufferData: Buffer = Buffer.alloc(0);
  private tempBufferArray: number[] = [];
  private expectedPacketLength: number = 0;
  private isReadingHeader: boolean = true;

  public getConnectAddr?: (complete: (addr?: string) => void) => void;

  private constructor() {
    super();
  }

  static sharedManager(): WKConnectionManager {
    if (!WKConnectionManager._instance) {
      WKConnectionManager._instance = new WKConnectionManager();
    }
    return WKConnectionManager._instance;
  }

  get connectStatus(): WKConnectStatus {
    return this._connectStatus;
  }

  private setConnectStatus(status: WKConnectStatus, reasonCode: WKReason = WKReason.Unknown): void {
    if (this._connectStatus !== status) {
      this._connectStatus = status;
      this.notifyConnectionStatus(status, reasonCode);
    }
  }

  setOptions(options: WKOptions): void {
    this.options = options;
  }

  setTransportType(type: WKTransportType): void {
    this.transportType = type;
  }

  connect(): void {
    if (this._connectStatus === WKConnectStatus.Connecting ||
        this._connectStatus === WKConnectStatus.Connected) {
      return;
    }

    this.isForceDisconnect = false;
    this.setConnectStatus(WKConnectStatus.Connecting);

    if (this.getConnectAddr) {
      this.getConnectAddr((addr) => {
        if (addr) {
          this.connectToAddress(addr);
        } else {
          this.connectWithDefaultAddress();
        }
      });
    } else {
      this.connectWithDefaultAddress();
    }
  }

  private connectWithDefaultAddress(): void {
    if (!this.options?.host || !this.options?.port) {
      this.setConnectStatus(WKConnectStatus.Disconnected, WKReason.ConnectError);
      return;
    }

    const addr = this.transportType === WKTransportType.WebSocket
      ? `ws://${this.options.host}:${this.options.port}`
      : this.options.host;

    this.connectToAddress(addr);
  }

  private async connectToAddress(address: string): Promise<void> {
    try {
      // 创建传输层实例
      this.createTransport();

      if (!this.transport) {
        throw new Error('Failed to create transport');
      }

      // 设置传输层事件监听
      this.setupTransportEventListeners();

      // 连接到服务器
      if (this.transportType === WKTransportType.TCP) {
        if (!this.options?.port) {
          throw new Error('Port is required for TCP connection');
        }
        await this.transport.connect(address, this.options.port);
      } else {
        // WebSocket连接
        await (this.transport as WKWebSocketTransport).connect(address);
      }

    } catch (error) {
      console.error('Connection failed:', error);
      this.setConnectStatus(WKConnectStatus.Disconnected, WKReason.ConnectError);
      this.scheduleReconnect();
    }
  }

  private createTransport(): void {
    // 清理旧的传输层
    if (this.transport) {
      this.transport.removeAllListeners();
      this.transport.disconnect();
    }

    // 创建新的传输层
    switch (this.transportType) {
      case WKTransportType.TCP:
        this.transport = new WKTCPTransport({
          connectTimeout: this.options?.connectTimeout || 30000,
        });
        break;
      case WKTransportType.WebSocket:
        this.transport = new WKWebSocketTransport();
        break;
      default:
        throw new Error(`Unsupported transport type: ${this.transportType}`);
    }
  }

  private setupTransportEventListeners(): void {
    if (!this.transport) return;

    this.transport.on('connect', () => {
      console.log('transport connected');
      this.onTransportConnected();
    });

    this.transport.on('data', (data: Buffer) => {
      console.log('transport data', data);
      this.onTransportData(data);
    });

    this.transport.on('error', (error: Error) => {
      console.log('transport error', error);
      this.onTransportError(error);
    });

    this.transport.on('close', (hadError?: boolean) => {
      console.log('transport close', hadError);
      this.onTransportClose(hadError);
    });

    this.transport.on('timeout', () => {
      console.log('transport timeout');
      this.onTransportTimeout();
    });
  }

  private onTransportConnected(): void {
    this.reconnectCount = 0;

    // 设置TCP特有选项
    if (this.transport instanceof WKTCPTransport) {
      this.transport.setKeepAlive(true, 30000);
      this.transport.setNoDelay(true);
    }

    this.sendConnectPacket();
  }

  private onTransportData(data: Buffer): void {
    // 将接收到的数据添加到缓冲区，使用JS SDK的数组方式
    const dataArray = Array.from(data);
    this.tempBufferData = Buffer.concat([this.tempBufferData, data]);

    // 使用JS SDK的解包逻辑
    this.unpacket(new Uint8Array(this.tempBufferData), (packets) => {
      if (packets.length > 0) {
        for (const packetData of packets) {
          this.onPacket(new Uint8Array(packetData));
        }
      }
    });
  }

  unpacket(data: Uint8Array, callback: (data: Array<Array<number>>) => void) {
    try {
      const dataArray = Array.from(data);
      this.tempBufferArray.push(...dataArray);

      let lenBefore, lenAfter;
      const dataList = new Array<Array<number>>();
      do {
        lenBefore = this.tempBufferArray.length;
        this.tempBufferArray = this.unpackOne(this.tempBufferArray, (packetData) => {
          dataList.push(packetData);
        });
        lenAfter = this.tempBufferArray.length;
        if (lenAfter > 0 && this.options?.isDebug) {
          console.log("有粘包！-->", this.tempBufferArray.length);
        }
      } while (lenBefore != lenAfter && lenAfter >= 1);

      if (dataList.length > 0) {
        callback(dataList);
        // 更新Buffer缓冲区
        this.tempBufferData = Buffer.from(this.tempBufferArray);
      }
    } catch (error) {
      console.log("解码数据异常---->", error);
      this.tempBufferArray = [];
      this.tempBufferData = Buffer.alloc(0);
    }
  }

  unpackOne(data: Array<number>, dataCallback: (data: Array<number>) => void): Array<number> {
    const header = data[0];
    const packetType = header >> 4;
    if (packetType == PacketType.PONG) {
      dataCallback([header]);
      return data.slice(1);
    }

    const length = data.length;
    const fixedHeaderLength = 1;
    let pos = fixedHeaderLength;
    let digit = 0;
    let remLength = 0;
    let multiplier = 1;
    let hasLength = false; // 是否还有长度数据没读完
    let remLengthFull = true; // 剩余长度的字节是否完整

    do {
      if (pos > length - 1) {
        // 这种情况出现了分包，并且分包的位置是长度部分的某个位置。这种情况不处理
        remLengthFull = false;
        break;
      }
      digit = data[pos++];
      remLength += ((digit & 127) * multiplier);
      multiplier *= 128;
      hasLength = (digit & 0x80) != 0;
    } while (hasLength);

    if (!remLengthFull) {
      if (this.options?.isDebug) {
        console.log("包的剩余长度的长度不够完整！");
      }
      return data;
    }

    let remLengthLength = pos - fixedHeaderLength; // 剩余长度的长度
    if (fixedHeaderLength + remLengthLength + remLength > length) {
      // 固定头的长度 + 剩余长度的长度 + 剩余长度 如果大于 总长度说明分包了
      if (this.options?.isDebug) {
        console.log("还有包未到，存入缓存！！！");
      }
      return data;
    } else {
      if (fixedHeaderLength + remLengthLength + remLength == length) {
        // 刚好一个包
        dataCallback(data);
        return [];
      } else {
        // 粘包  大于1个包
        const packetLength = fixedHeaderLength + remLengthLength + remLength;
        if (this.options?.isDebug) {
          console.log("粘包  大于1个包", "，packetLength:", packetLength, "length:", length);
        }
        dataCallback(data.slice(0, packetLength));
        return data.slice(packetLength);
      }
    }
  }

  onPacket(data: Uint8Array) {
    try {
      // 优先使用 proto 协议解码
      const protoPacket = this.getProto().decode(data);
      this.handleProtoPacket(protoPacket as any);
    } catch (e1) {
      try {
        // 兼容旧协议解码
        const legacyPacket = WKPacket.decode(Buffer.from(data));
        this.handlePacket(legacyPacket);
      } catch (e2) {
        console.error('Failed to decode packet (proto & legacy):', e1, e2);
      }
    }
  }

  private onTransportError(error: Error): void {
    console.error('Transport error:', error);
    this.setConnectStatus(WKConnectStatus.Disconnected, WKReason.ConnectError);
  }

  private onTransportClose(hadError?: boolean): void {
    this.clearPingInterval();

    if (!this.isForceDisconnect) {
      this.setConnectStatus(WKConnectStatus.Disconnected, WKReason.ConnectError);
      this.scheduleReconnect();
    }
  }

  private onTransportTimeout(): void {
    console.warn('Transport timeout');
    this.setConnectStatus(WKConnectStatus.Disconnected, WKReason.ConnectTimeout);
  }

  private dhPrivateKey!: Uint8Array; // DH私钥

  private sendConnectPacket(): void {
    if (!this.options?.connectInfo) {
      this.setConnectStatus(WKConnectStatus.Disconnected, WKReason.ConnectError);
      return;
    }

    // 使用 proto 协议构造 CONNECT 包
    const seed = Uint8Array.from(this.stringToUint(Guid.create().toString().replace(/-/g, "")));
    const keyPair = generateKeyPair(seed);
    const pubKey = buffer.Buffer.from(keyPair.public).toString('base64');
    
    // 保存私钥用于后续密钥协商
    this.dhPrivateKey = keyPair.private;

    const p = new ConnectPacket();
    p.version = 4;
    p.deviceFlag = 1; // 1: web/通用
    const deviceID = Guid.create().toString().replace(/-/g, '');
    p.deviceID = deviceID + 'W';
    p.uid = this.options.connectInfo.uid;
    p.token = this.options.connectInfo.token;
    p.clientTimestamp = Date.now();
    p.clientKey = pubKey;

    if (this.options.isDebug) {
      console.log('📤 发送连接包:', {
        uid: p.uid,
        token: p.token,
        deviceID: p.deviceID,
        clientTimestamp: p.clientTimestamp,
        version: p.version
      });
    }

    try {
      const data = this.getProto().encode(p);
      this.transport?.send(Buffer.from(data));
    } catch (error) {
      console.error('Failed to send packet:', error);
    }
  }

   /* tslint:disable */
   stringToUint(str: string) {
    const string = unescape(encodeURIComponent(str));
    const charList = string.split('');
    const uintArray = new Array();
    for (let i = 0; i < charList.length; i++) {
        uintArray.push(charList[i].charCodeAt(0));
    }
    return uintArray;
}

  private generateDeviceID(): string {
    return `nodejs_${this.transportType}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private handlePacket(packet: WKPacket): void {
    this.emit('packet', packet);
    this.handleInternalPacket(packet);
  }

  private handleInternalPacket(packet: WKPacket): void {
    // 添加调试信息
    if (this.options?.isDebug) {
      console.log('📥 收到包:', {
        packetType: packet.header.packetType,
        flag: packet.header.flag,
        remainingLength: packet.header.remainingLength
      });
    }

    switch (packet.header.packetType) {
      case 2: // CONNACK
        this.handleConnackPacket(packet);
        break;
      case 8: // PONG
        // 处理pong包
        if (this.options?.isDebug) {
          console.log('📥 收到PONG包');
        }
        break;
      default:
        if ((packet.header.packetType as any) === 0) {
          // 未知包类型 0
          if (this.options?.isDebug) {
            console.log('📥 收到未知包类型 0');
          }
        } else {
          if (this.options?.isDebug) {
            console.log('📥 收到其他包类型:', packet.header.packetType);
          }
        }
        break;
    }
  }

  // 处理 proto 协议包
  private handleProtoPacket(packet: any): void {
    if (this.options?.isDebug) {
      console.log('📥 收到proto包:', {
        packetType: packet.packetType,
      });
    }

    switch (packet.packetType) {
      case PacketType.CONNACK:
        this.handleConnackPacket(packet);
        break;
      case PacketType.PONG:
        if (this.options?.isDebug) {
          console.log('📥 收到PONG包');
        }
        break;
      case PacketType.RECV: // 收到消息
      case PacketType.SENDACK: // 发送消息确认
      case PacketType.SUBACK: // 订阅确认
      case PacketType.Event: // 事件消息
      case PacketType.DISCONNECT: // 断开连接
        // 透传给监听者，让ChatManager等处理
        this.emit('packet', packet);
        if (this.options?.isDebug) {
          console.log('📥 收到消息相关包:', packet.packetType);
        }
        break;
      default:
        // 透传给监听者（与旧事件名保持一致，方便上层逐步迁移）
        this.emit('packet', packet);
        if (this.options?.isDebug) {
          console.log('📥 收到其他proto包:', packet.packetType);
        }
        break;
    }
  }

  private handleConnackPacket(packet: any): void {
    if (this.options?.isDebug) {
      console.log('📥 收到CONNACK包:', {
        reasonCode: packet.reasonCode,
        serverVersion: packet.serverVersion,
        serverKey: packet.serverKey ? packet.serverKey.substring(0, 8) + '...' : 'none',
        salt: packet.salt ? packet.salt.substring(0, 8) + '...' : 'none'
      });
      console.log('packet',packet);
      
    }

    if (packet.reasonCode === 1) {
      // 设置加密密钥
      if (packet.serverKey && packet.salt && this.dhPrivateKey) {
        try {
          const serverPubKey = Uint8Array.from(buffer.Buffer.from(packet.serverKey, "base64"));
          const secret = sharedKey(this.dhPrivateKey, serverPubKey);
          const secretBase64 = buffer.Buffer.from(secret).toString("base64");
          const aesKeyFull = Md5.init(secretBase64);
          
          SecurityManager.shared().aesKey = aesKeyFull.substring(0, 16);
          if (packet.salt && packet.salt.length > 16) {
            SecurityManager.shared().aesIV = packet.salt.substring(0, 16);
          } else {
            SecurityManager.shared().aesIV = packet.salt;
          }
          
          if (this.options?.isDebug) {
            console.log('🔐 密钥协商成功');
          }
        } catch (error) {
          console.error('密钥协商失败:', error);
        }
      }
      
      this.setConnectStatus(WKConnectStatus.Connected);
      this.startPingInterval();
    } else {
      let reason = WKReason.ConnectError;
      let reasonText = '未知错误';
      switch (packet.reasonCode) {
        case 0:
          reason = WKReason.TokenError;
          reasonText = 'Token错误';
          break;
        case 2:
          reason = WKReason.TokenExpired;
          reasonText = 'Token过期';
          break;
        default:
          reason = WKReason.ConnectError;
          reasonText = `错误代码: ${packet.reasonCode}`;
      }
      
      if (this.options?.isDebug) {
        console.log('❌ 连接被拒绝:', reasonText);
      }
      
      this.setConnectStatus(WKConnectStatus.Disconnected, reason);
    }
  }

  disconnect(force: boolean = false): void {
    this.isForceDisconnect = force;
    this.clearReconnectTimeout();
    this.clearPingInterval();

    if (this.transport) {
      this.transport.disconnect();
    }

    this.setConnectStatus(WKConnectStatus.Disconnected, WKReason.Unknown);
  }

  logout(): void {
    this.disconnect(true);
    this.options = undefined;
  }

  getProto(): IProto {
    return new Proto();
  }


  sendPacket(packet: any): void {
    if (!this.transport?.isConnected) {
      console.warn('Transport is not connected, cannot send packet');
      return;
    }

    try {
      // 兼容：若是 proto 包，使用 proto 编码；否则尝试旧协议编码
      if (typeof packet?.packetType !== 'undefined' && typeof packet?.encode !== 'function') {
        const data = this.getProto().encode(packet);
        this.transport.send(Buffer.from(data));
      } else if (typeof packet?.encode === 'function') {
        const bufferData = packet.encode();
        this.transport.send(bufferData);
      } else {
        console.error('Unknown packet format, cannot send');
      }
    } catch (error) {
      console.error('Failed to send packet:', error);
    }
  }

  writeData(data: Buffer): void {
    if (!this.transport?.isConnected) {
      console.warn('Transport is not connected, cannot send data');
      return;
    }

    this.transport.send(data);
  }

  sendPing(): void {
    // 使用 proto Ping
    const ping = new PingPacket();
    try {
      const data = this.getProto().encode(ping);
      this.transport?.send(Buffer.from(data));
    } catch (error) {
      console.error('Failed to send ping:', error);
    }
  }

  wakeup(timeout: number, complete?: (error?: Error) => void): void {
    if (this._connectStatus === WKConnectStatus.Connected) {
      complete?.();
      return;
    }

    const timeoutId = setTimeout(() => {
      complete?.(new Error('Wakeup timeout'));
    }, timeout);

    const statusListener = (status: WKConnectStatus) => {
      if (status === WKConnectStatus.Connected) {
        clearTimeout(timeoutId);
        this.removeListener('connectStatus', statusListener);
        complete?.();
      }
    };

    this.on('connectStatus', statusListener);
    this.connect();
  }

  addDelegate(delegate: WKConnectionManagerDelegate): void {
    this.delegates.add(delegate);
  }

  removeDelegate(delegate: WKConnectionManagerDelegate): void {
    this.delegates.delete(delegate);
  }

  private notifyConnectionStatus(status: WKConnectStatus, reasonCode: WKReason): void {
    this.emit('connectStatus', status, reasonCode);

    this.delegates.forEach(delegate => {
      delegate.onConnectStatus?.(status, reasonCode);
    });
  }

  private notifyKick(reasonCode: number, reason: string): void {
    this.delegates.forEach(delegate => {
      delegate.onKick?.(reasonCode, reason);
    });
  }

  private startPingInterval(): void {
    this.clearPingInterval();
    const interval = this.options?.pingInterval || 30000;
    this.pingInterval = setInterval(() => {
      this.sendPing();
    }, interval);
  }

  private clearPingInterval(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = undefined;
    }
  }

  private scheduleReconnect(): void {
    if (this.isForceDisconnect || this.reconnectCount >= this.maxReconnectCount) {
      return;
    }

    this.clearReconnectTimeout();
    const delay = Math.min(1000 * Math.pow(2, this.reconnectCount), 30000); // 指数退避，最大30秒

    this.reconnectTimeout = setTimeout(() => {
      this.reconnectCount++;
      this.connect();
    }, delay);
  }

  private clearReconnectTimeout(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = undefined;
    }
  }

  // 获取连接信息
  getConnectionInfo(): {
    status: WKConnectStatus;
    transportType: WKTransportType;
    isConnected: boolean;
    reconnectCount: number;
    address?: string;
  } {
    return {
      status: this._connectStatus,
      transportType: this.transportType,
      isConnected: this.transport?.isConnected || false,
      reconnectCount: this.reconnectCount,
      address: this.options?.host,
    };
  }
}