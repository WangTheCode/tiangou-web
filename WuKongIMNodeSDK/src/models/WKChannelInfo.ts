export class WKChannelInfo {
  public channelId: string = '';      // 频道ID
  public channelType: number = 0;     // 频道类型
  public name: string = '';           // 频道名称
  public avatar?: string;             // 头像
  public remark?: string;             // 备注
  public status?: number;             // 状态
  public extra?: { [key: string]: any }; // 扩展信息

  constructor(channelId?: string, channelType?: number) {
    if (channelId) {
      this.channelId = channelId;
    }
    if (channelType !== undefined) {
      this.channelType = channelType;
    }
  }

  static fromMap(data: { [key: string]: any }): WKChannelInfo {
    const info = new WKChannelInfo();
    info.channelId = data.channelId || '';
    info.channelType = data.channelType || 0;
    info.name = data.name || '';
    info.avatar = data.avatar;
    info.remark = data.remark;
    info.status = data.status;
    info.extra = data.extra;
    return info;
  }

  toMap(): { [key: string]: any } {
    return {
      channelId: this.channelId,
      channelType: this.channelType,
      name: this.name,
      avatar: this.avatar,
      remark: this.remark,
      status: this.status,
      extra: this.extra,
    };
  }

  equals(other: WKChannelInfo): boolean {
    return this.channelId === other.channelId && this.channelType === other.channelType;
  }
}