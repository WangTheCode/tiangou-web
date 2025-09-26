import { EventEmitter } from 'events';
import * as net from 'net';

export abstract class WKTransport extends EventEmitter {
  protected _isConnected: boolean = false;
  protected _isConnecting: boolean = false;

  abstract connect(address: string, port: number): Promise<void>;
  abstract disconnect(): void;
  abstract send(data: Buffer): void;

  get isConnected(): boolean {
    return this._isConnected;
  }

  get isConnecting(): boolean {
    return this._isConnecting;
  }
}

export class WKTCPTransport extends WKTransport {
  private socket?: net.Socket;
  private host: string = '';
  private port: number = 0;
  private connectTimeout: number = 30000;

  constructor(options?: { connectTimeout?: number }) {
    super();
    if (options?.connectTimeout) {
      this.connectTimeout = options.connectTimeout;
    }
  }

  async connect(address: string, port: number): Promise<void> {
    if (this._isConnected || this._isConnecting) {
      return;
    }

    this.host = address;
    this.port = port;
    this._isConnecting = true;

    return new Promise((resolve, reject) => {
      this.socket = new net.Socket();

      // 设置连接超时
      const timeoutId = setTimeout(() => {
        this.socket?.destroy();
        this._isConnecting = false;
        reject(new Error('Connection timeout'));
      }, this.connectTimeout);

      this.socket.on('connect', () => {
        clearTimeout(timeoutId);
        this._isConnected = true;
        this._isConnecting = false;
        this.emit('connect');
        resolve();
      });

      this.socket.on('data', (data: Buffer) => {
        this.emit('data', data);
      });

      this.socket.on('error', (error: Error) => {
        clearTimeout(timeoutId);
        this._isConnected = false;
        this._isConnecting = false;
        this.emit('error', error);
        if (this._isConnecting) {
          reject(error);
        }
      });

      this.socket.on('close', (hadError: boolean) => {
        clearTimeout(timeoutId);
        this._isConnected = false;
        this._isConnecting = false;
        this.emit('close', hadError);
      });

      this.socket.on('timeout', () => {
        this.socket?.destroy();
        this.emit('timeout');
      });

      // 开始连接
      this.socket.connect(port, address);
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.destroy();
      this.socket = undefined;
    }
    this._isConnected = false;
    this._isConnecting = false;
  }

  send(data: Buffer): void {
    if (!this._isConnected || !this.socket) {
      throw new Error('Socket is not connected');
    }

    this.socket.write(data);
  }

  // 设置socket选项
  setKeepAlive(enable: boolean, initialDelay?: number): void {
    if (this.socket) {
      this.socket.setKeepAlive(enable, initialDelay);
    }
  }

  setNoDelay(noDelay: boolean = true): void {
    if (this.socket) {
      this.socket.setNoDelay(noDelay);
    }
  }

  setTimeout(timeout: number): void {
    if (this.socket) {
      this.socket.setTimeout(timeout);
    }
  }
}

// WebSocket传输层（保留原有功能）
export class WKWebSocketTransport extends WKTransport {
  private ws?: any; // WebSocket实例
  private url: string = '';

  async connect(url: string): Promise<void> {
    if (this._isConnected || this._isConnecting) {
      return;
    }

    // 动态导入ws模块
    const WebSocket = require('ws');

    this.url = url;
    this._isConnecting = true;

    return new Promise((resolve, reject) => {
      // this.ws = new WebSocket(url);
      this.ws = new WebSocket('wss://tgdd-ws.jx3kaihe.top');

      this.ws.binaryType = 'arraybuffer';


      this.ws.on('open', () => {
        this._isConnected = true;
        this._isConnecting = false;
        console.log('wk open');
        this.emit('connect');

        resolve();
      });

      this.ws.on('message', (data: any) => {
        try {
          let buf: Buffer | undefined;
          if (Buffer.isBuffer(data)) {
            buf = data;
          } else if (data instanceof ArrayBuffer) {
            buf = Buffer.from(new Uint8Array(data));
          } else if (ArrayBuffer.isView && ArrayBuffer.isView(data)) {
            buf = Buffer.from(data.buffer, data.byteOffset, data.byteLength);
          } else if (typeof data === 'string') {
            buf = Buffer.from(data, 'utf8');
          }
          if (buf) {
            this.emit('data', buf);
          }
        } catch (e) {
          this.emit('error', e as Error);
        }
      });

      this.ws.on('error', (error: Error) => {
        this._isConnected = false;
        this._isConnecting = false;
        this.emit('error', error);
        if (this._isConnecting) {
          reject(error);
        }
      });

      this.ws.on('close', (code: number, reason: Buffer) => {
        this._isConnected = false;
        this._isConnecting = false;
        this.emit('close', code, reason);
      });
    });
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = undefined;
    }
    this._isConnected = false;
    this._isConnecting = false;
  }

  send(data: Buffer): void {
    if (!this._isConnected || !this.ws) {
      throw new Error('WebSocket is not connected');
    }

    this.ws.send(data);
  }
}