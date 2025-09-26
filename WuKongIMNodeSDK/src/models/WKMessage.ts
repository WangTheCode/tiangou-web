import { WKChannel } from './WKChannel';
import { WKMessageContent } from './WKMessageContent';
import { WKChannelInfo } from './WKChannelInfo';
import { WKMessageStatus, WKReason, WKStreamFlag } from '../types';

export class WKMessageHeader {
  public showUnread: boolean = false; // 是否显示红点
  public noPersist: boolean = false;  // 是否不存储
  public syncOnce: boolean = false;   // 同步一次标记
}

export class WKSetting {
  public receipt?: boolean;          // 是否需要回执
  public signal?: boolean;           // 是否为信令消息
  public stream?: boolean;           // 是否为流消息
  public topic?: string;             // 话题
}

export class WKMessageExtra {
  public contentEdit?: any;          // 编辑内容
  public revoke?: boolean;           // 是否撤回
  public revokeTime?: number;        // 撤回时间
  public extra?: { [key: string]: any }; // 扩展字段
}

export class WKReaction {
  public emoji: string = '';         // 表情符号
  public count: number = 0;          // 数量
  public isChoose: boolean = false;  // 当前用户是否选择
}

export class WKStream {
  public streamSeq: number = 0;      // 流序号
  public streamFlag: WKStreamFlag = WKStreamFlag.Start;
  public streamNo: string = '';      // 流编号
  public content?: any;              // 流内容
}

export class WKMessage {
  public header: WKMessageHeader = new WKMessageHeader();
  public setting?: WKSetting;

  // 基本信息
  public clientSeq: number = 0;              // 客户端序列号
  public clientMsgNo: string = '';           // 客户端消息唯一编号
  public streamNo?: string;                  // 流式编号
  public streamFlag: WKStreamFlag = WKStreamFlag.Start;
  public streamSeq: number = 0;              // 流式序号
  public messageId: number = 0;              // 消息ID
  public messageSeq: number = 0;             // 消息序列号
  public orderSeq: number = 0;               // 消息排序号
  public timestamp: number = 0;              // 服务器时间戳（秒）
  public localTimestamp: number = 0;         // 本地创建时间

  // 发送者和接收者
  public from?: WKChannelInfo;               // 发送者信息
  public topic?: string;                     // 消息话题
  public fromUid: string = '';               // 发送者UID
  public toUid?: string;                     // 接收者UID

  // 频道信息
  public channel!: WKChannel;                // 频道
  public parentChannel?: WKChannel;          // 父频道
  public channelInfo?: WKChannelInfo;        // 频道资料

  // 消息内容
  public contentType: number = 0;            // 正文类型
  public content?: WKMessageContent;         // 消息正文
  public contentData?: Buffer;               // 消息正文data数据

  // 状态相关
  public voiceReaded: boolean = false;       // 语音是否已读
  public status: WKMessageStatus = WKMessageStatus.Normal;
  public reasonCode: WKReason = WKReason.Unknown;
  public task?: any;                         // 关联任务

  // 扩展信息
  public extra: { [key: string]: any } = {}; // 本地扩展数据
  public reactions?: WKReaction[];            // 消息回应集合
  public isDeleted: boolean = false;          // 是否被删除

  // 远程扩展
  public hasRemoteExtra: boolean = false;    // 是否有远程扩展
  public viewed: boolean = false;             // 是否已查看
  public viewedAt: number = 0;               // 查看时间戳
  public remoteExtra?: WKMessageExtra;       // 远程扩展

  // 流式消息
  public syncStreamsFromDB: boolean = false;
  public streams: WKStream[] = [];           // 流式消息内容
  public streamOn: boolean = false;          // 是否开启stream

  // 过期相关
  public expire: number = 0;                 // 过期时长（秒）
  public expireAt?: Date;                    // 过期时间

  constructor() {
    this.localTimestamp = Date.now();
  }

  // 是否是发送消息
  isSend(): boolean {
    return this.fromUid === this.getSelfUID();
  }

  private getSelfUID(): string {
    // 这里应该从SDK中获取当前用户UID
    // 暂时返回空字符串，实际使用时需要实现
    return '';
  }

  // 生成客户端消息编号
  static generateClientMsgNo(): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    return `${timestamp}${random}`;
  }

  // 生成客户端序列号
  static generateClientSeq(): number {
    return Math.floor(Math.random() * 4294967295); // 32位无符号整数最大值
  }
}