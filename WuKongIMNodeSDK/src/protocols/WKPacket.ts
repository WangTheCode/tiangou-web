import { WKPacketType } from '../types';

export class WKHeader {
  public packetType: WKPacketType = WKPacketType.Connect;
  public flag: number = 0;         // 标记位
  public remainingLength: number = 0; // 剩余长度

  constructor(packetType?: WKPacketType, flag?: number) {
    if (packetType !== undefined) {
      this.packetType = packetType;
    }
    if (flag !== undefined) {
      this.flag = flag;
    }
  }

  // 编码header为字节数组
  encode(): Buffer {
    const buffer = Buffer.alloc(1 + this.encodeRemainingLength().length);
    let offset = 0;

    // 第一个字节：高4位是包类型，低4位是标记位
    buffer[offset++] = (this.packetType << 4) | (this.flag & 0x0F);

    // 剩余长度编码
    const remainingLengthBytes = this.encodeRemainingLength();
    remainingLengthBytes.copy(buffer, offset);

    return buffer;
  }

  // 编码剩余长度
  private encodeRemainingLength(): Buffer {
    const bytes: number[] = [];
    let length = this.remainingLength;

    do {
      let byte = length % 128;
      length = Math.floor(length / 128);
      if (length > 0) {
        byte |= 0x80;
      }
      bytes.push(byte);
    } while (length > 0);

    return Buffer.from(bytes);
  }

  // 解码header
  static decode(buffer: Buffer): { header: WKHeader; offset: number } {
    const header = new WKHeader();
    let offset = 0;

    // 解析第一个字节
    const firstByte = buffer[offset++];
    header.packetType = (firstByte >> 4) & 0x0F;
    header.flag = firstByte & 0x0F;

    // 解析剩余长度
    let remainingLength = 0;
    let multiplier = 1;

    while (offset < buffer.length) {
      const byte = buffer[offset++];
      remainingLength += (byte & 0x7F) * multiplier;

      if ((byte & 0x80) === 0) {
        break;
      }

      multiplier *= 128;
      if (multiplier > 128 * 128 * 128) {
        throw new Error('Invalid remaining length');
      }
    }

    header.remainingLength = remainingLength;
    return { header, offset };
  }
}

export abstract class WKPacket {
  public header: WKHeader;

  constructor(packetType: WKPacketType, flag: number = 0) {
    this.header = new WKHeader(packetType, flag);
  }

  // 抽象方法：编码包体
  abstract encodeBody(): Buffer;

  // 抽象方法：解码包体
  abstract decodeBody(buffer: Buffer): void;

  // 编码整个包
  encode(): Buffer {
    const body = this.encodeBody();
    this.header.remainingLength = body.length;
    const headerBuffer = this.header.encode();

    return Buffer.concat([headerBuffer, body]);
  }

  // 解码包
  static decode(buffer: Buffer): WKPacket {
    const { header, offset } = WKHeader.decode(buffer);
    const bodyBuffer = buffer.slice(offset, offset + header.remainingLength);

    let packet: WKPacket;

    switch (header.packetType) {
      case WKPacketType.Connect:
        packet = new WKConnectPacket();
        break;
      case WKPacketType.Connack:
        packet = new WKConnackPacket();
        break;
      case WKPacketType.Send:
        packet = new WKSendPacket();
        break;
      case WKPacketType.Sendack:
        packet = new WKSendackPacket();
        break;
      case WKPacketType.Recv:
        packet = new WKRecvPacket();
        break;
      case WKPacketType.Recvack:
        packet = new WKRecvackPacket();
        break;
      case WKPacketType.Ping:
        packet = new WKPingPacket();
        break;
      case WKPacketType.Pong:
        packet = new WKPongPacket();
        break;
      case WKPacketType.Disconnect:
        packet = new WKDisconnectPacket();
        break;
      case 0 as any:
        // 包类型 0 可能是服务端的特殊包或心跳包，创建通用包处理
        console.warn(`Received packet type 0, treating as unknown packet`);
        packet = new WKUnknownPacket();
        break;
      default:
        throw new Error(`Unknown packet type: ${header.packetType}`);
    }

    packet.header = header;
    packet.decodeBody(bodyBuffer);

    return packet;
  }
}

// 连接包
export class WKConnectPacket extends WKPacket {
  public version: number = 5;      // 协议版本
  public deviceFlag: number = 0;   // 设备标记
  public deviceID: string = '';    // 设备ID
  public uid: string = '';         // 用户ID
  public token: string = '';       // 连接token
  public clientTimestamp: number = 0; // 客户端时间戳
  public clientKey: string = '';   // 客户端key
  public end: boolean = false;    // 是否结束

  constructor() {
    super(WKPacketType.Connect);
  }

  encodeBody(): Buffer {
    const versionBuffer = Buffer.alloc(1);
    versionBuffer.writeUInt8(this.version, 0);

    const deviceFlagBuffer = Buffer.alloc(1);
    deviceFlagBuffer.writeUInt8(this.deviceFlag, 0);

    const deviceIDBuffer = this.encodeString(this.deviceID);
    const uidBuffer = this.encodeString(this.uid);
    const tokenBuffer = this.encodeString(this.token);

    const timestampBuffer = Buffer.alloc(8);
    timestampBuffer.writeBigUInt64BE(BigInt(this.clientTimestamp), 0);

    return Buffer.concat([
      versionBuffer,
      deviceFlagBuffer,
      deviceIDBuffer,
      uidBuffer,
      tokenBuffer,
      timestampBuffer,
    ]);
  }

  decodeBody(buffer: Buffer): void {
    let offset = 0;

    this.version = buffer.readUInt8(offset);
    offset += 1;

    this.deviceFlag = buffer.readUInt8(offset);
    offset += 1;

    const deviceIDResult = this.decodeString(buffer, offset);
    this.deviceID = deviceIDResult.value;
    offset = deviceIDResult.offset;

    const uidResult = this.decodeString(buffer, offset);
    this.uid = uidResult.value;
    offset = uidResult.offset;

    const tokenResult = this.decodeString(buffer, offset);
    this.token = tokenResult.value;
    offset = tokenResult.offset;

    if (offset + 8 <= buffer.length) {
      this.clientTimestamp = Number(buffer.readBigUInt64BE(offset));
    }
  }

  private encodeString(str: string): Buffer {
    const strBuffer = Buffer.from(str, 'utf8');
    const lengthBuffer = Buffer.alloc(2);
    lengthBuffer.writeUInt16BE(strBuffer.length, 0);
    return Buffer.concat([lengthBuffer, strBuffer]);
  }

  private decodeString(buffer: Buffer, offset: number): { value: string; offset: number } {
    const length = buffer.readUInt16BE(offset);
    offset += 2;
    const value = buffer.toString('utf8', offset, offset + length);
    offset += length;
    return { value, offset };
  }
}

// 连接确认包
export class WKConnackPacket extends WKPacket {
  public serverVersion: number = 0;
  public reasonCode: number = 0;
  public serverKey?: string;
  public salt?: string;

  constructor() {
    super(WKPacketType.Connack);
  }

  encodeBody(): Buffer {
    const versionBuffer = Buffer.alloc(1);
    versionBuffer.writeUInt8(this.serverVersion, 0);

    const reasonBuffer = Buffer.alloc(1);
    reasonBuffer.writeUInt8(this.reasonCode, 0);

    const serverKeyBuffer = this.serverKey ? this.encodeString(this.serverKey) : Buffer.alloc(2);
    const saltBuffer = this.salt ? this.encodeString(this.salt) : Buffer.alloc(2);

    return Buffer.concat([versionBuffer, reasonBuffer, serverKeyBuffer, saltBuffer]);
  }

  decodeBody(buffer: Buffer): void {
    let offset = 0;

    this.serverVersion = buffer.readUInt8(offset);
    offset += 1;

    this.reasonCode = buffer.readUInt8(offset);
    offset += 1;

    if (offset < buffer.length) {
      const serverKeyResult = this.decodeString(buffer, offset);
      this.serverKey = serverKeyResult.value || undefined;
      offset = serverKeyResult.offset;
    }

    if (offset < buffer.length) {
      const saltResult = this.decodeString(buffer, offset);
      this.salt = saltResult.value || undefined;
    }
  }

  private encodeString(str: string): Buffer {
    const strBuffer = Buffer.from(str, 'utf8');
    const lengthBuffer = Buffer.alloc(2);
    lengthBuffer.writeUInt16BE(strBuffer.length, 0);
    return Buffer.concat([lengthBuffer, strBuffer]);
  }

  private decodeString(buffer: Buffer, offset: number): { value: string; offset: number } {
    const length = buffer.readUInt16BE(offset);
    offset += 2;
    const value = buffer.toString('utf8', offset, offset + length);
    offset += length;
    return { value, offset };
  }
}

// 发送包
export class WKSendPacket extends WKPacket {
  public setting: number = 0;
  public clientSeq: number = 0;
  public clientMsgNo: string = '';
  public streamNo: string = '';
  public streamSeq: number = 0;
  public streamFlag: number = 0;
  public channelID: string = '';
  public channelType: number = 0;
  public clientTimestamp: number = 0;
  public topic: string = '';
  public expire: number = 0;
  public payload: Buffer = Buffer.alloc(0);

  constructor() {
    super(WKPacketType.Send);
  }

  encodeBody(): Buffer {
    const buffers: Buffer[] = [];

    // Setting (1 byte)
    const settingBuffer = Buffer.alloc(1);
    settingBuffer.writeUInt8(this.setting, 0);
    buffers.push(settingBuffer);

    // Client Seq (4 bytes)
    const clientSeqBuffer = Buffer.alloc(4);
    clientSeqBuffer.writeUInt32BE(this.clientSeq, 0);
    buffers.push(clientSeqBuffer);

    // Client Msg No
    buffers.push(this.encodeString(this.clientMsgNo));

    // Stream No
    buffers.push(this.encodeString(this.streamNo));

    // Stream Seq (8 bytes)
    const streamSeqBuffer = Buffer.alloc(8);
    streamSeqBuffer.writeBigUInt64BE(BigInt(this.streamSeq), 0);
    buffers.push(streamSeqBuffer);

    // Stream Flag (1 byte)
    const streamFlagBuffer = Buffer.alloc(1);
    streamFlagBuffer.writeUInt8(this.streamFlag, 0);
    buffers.push(streamFlagBuffer);

    // Channel ID
    buffers.push(this.encodeString(this.channelID));

    // Channel Type (1 byte)
    const channelTypeBuffer = Buffer.alloc(1);
    channelTypeBuffer.writeUInt8(this.channelType, 0);
    buffers.push(channelTypeBuffer);

    // Client Timestamp (8 bytes)
    const timestampBuffer = Buffer.alloc(8);
    timestampBuffer.writeBigUInt64BE(BigInt(this.clientTimestamp), 0);
    buffers.push(timestampBuffer);

    // Topic
    buffers.push(this.encodeString(this.topic));

    // Expire (4 bytes)
    const expireBuffer = Buffer.alloc(4);
    expireBuffer.writeUInt32BE(this.expire, 0);
    buffers.push(expireBuffer);

    // Payload length (4 bytes)
    const payloadLengthBuffer = Buffer.alloc(4);
    payloadLengthBuffer.writeUInt32BE(this.payload.length, 0);
    buffers.push(payloadLengthBuffer);

    // Payload
    buffers.push(this.payload);

    return Buffer.concat(buffers);
  }

  decodeBody(buffer: Buffer): void {
    let offset = 0;

    this.setting = buffer.readUInt8(offset);
    offset += 1;

    this.clientSeq = buffer.readUInt32BE(offset);
    offset += 4;

    const clientMsgNoResult = this.decodeString(buffer, offset);
    this.clientMsgNo = clientMsgNoResult.value;
    offset = clientMsgNoResult.offset;

    const streamNoResult = this.decodeString(buffer, offset);
    this.streamNo = streamNoResult.value;
    offset = streamNoResult.offset;

    this.streamSeq = Number(buffer.readBigUInt64BE(offset));
    offset += 8;

    this.streamFlag = buffer.readUInt8(offset);
    offset += 1;

    const channelIDResult = this.decodeString(buffer, offset);
    this.channelID = channelIDResult.value;
    offset = channelIDResult.offset;

    this.channelType = buffer.readUInt8(offset);
    offset += 1;

    this.clientTimestamp = Number(buffer.readBigUInt64BE(offset));
    offset += 8;

    const topicResult = this.decodeString(buffer, offset);
    this.topic = topicResult.value;
    offset = topicResult.offset;

    this.expire = buffer.readUInt32BE(offset);
    offset += 4;

    const payloadLength = buffer.readUInt32BE(offset);
    offset += 4;

    this.payload = buffer.slice(offset, offset + payloadLength);
  }

  private encodeString(str: string): Buffer {
    const strBuffer = Buffer.from(str, 'utf8');
    const lengthBuffer = Buffer.alloc(2);
    lengthBuffer.writeUInt16BE(strBuffer.length, 0);
    return Buffer.concat([lengthBuffer, strBuffer]);
  }

  private decodeString(buffer: Buffer, offset: number): { value: string; offset: number } {
    const length = buffer.readUInt16BE(offset);
    offset += 2;
    const value = buffer.toString('utf8', offset, offset + length);
    offset += length;
    return { value, offset };
  }
}

// 其他包类型的简化实现
export class WKSendackPacket extends WKPacket {
  public clientSeq: number = 0;
  public messageID: number = 0;
  public messageSeq: number = 0;
  public reasonCode: number = 0;

  constructor() { super(WKPacketType.Sendack); }
  encodeBody(): Buffer { return Buffer.alloc(0); }
  decodeBody(buffer: Buffer): void {}
}

export class WKRecvPacket extends WKPacket {
  constructor() { super(WKPacketType.Recv); }
  encodeBody(): Buffer { return Buffer.alloc(0); }
  decodeBody(buffer: Buffer): void {}
}

export class WKRecvackPacket extends WKPacket {
  constructor() { super(WKPacketType.Recvack); }
  encodeBody(): Buffer { return Buffer.alloc(0); }
  decodeBody(buffer: Buffer): void {}
}

export class WKPingPacket extends WKPacket {
  constructor() { super(WKPacketType.Ping); }
  encodeBody(): Buffer { return Buffer.alloc(0); }
  decodeBody(buffer: Buffer): void {}
}

export class WKPongPacket extends WKPacket {
  constructor() { super(WKPacketType.Pong); }
  encodeBody(): Buffer { return Buffer.alloc(0); }
  decodeBody(buffer: Buffer): void {}
}

export class WKDisconnectPacket extends WKPacket {
  public reasonCode: number = 0;
  public reason: string = '';

  constructor() { super(WKPacketType.Disconnect); }
  encodeBody(): Buffer { return Buffer.alloc(0); }
  decodeBody(buffer: Buffer): void {}
}

// 未知包类型处理
export class WKUnknownPacket extends WKPacket {
  public data: Buffer = Buffer.alloc(0);

  constructor() { super(0 as any); }
  encodeBody(): Buffer { return this.data; }
  decodeBody(buffer: Buffer): void { 
    this.data = buffer;
  }
}