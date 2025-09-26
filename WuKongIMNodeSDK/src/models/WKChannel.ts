export class WKChannel {
  public channelId: string;
  public channelType: number;

  constructor(channelId: string, channelType: number) {
    this.channelId = channelId;
    this.channelType = channelType;
  }

  static channelID(channelId: string, channelType: number): WKChannel {
    return new WKChannel(channelId, channelType);
  }

  static groupWithChannelID(channelID: string): WKChannel {
    return new WKChannel(channelID, 2); // 群聊类型为2
  }

  static personWithChannelID(channelID: string): WKChannel {
    return new WKChannel(channelID, 1); // 个人聊天类型为1
  }

  toMap(): { [key: string]: any } {
    return {
      channelId: this.channelId,
      channelType: this.channelType,
    };
  }

  static fromMap(dict: { [key: string]: any }): WKChannel {
    return new WKChannel(dict.channelId, dict.channelType);
  }

  equals(other: WKChannel): boolean {
    return this.channelId === other.channelId && this.channelType === other.channelType;
  }

  toString(): string {
    return `WKChannel(channelId: ${this.channelId}, channelType: ${this.channelType})`;
  }
}