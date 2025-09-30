import { Channel, Conversation, Message, MessageExtra, PullMode } from 'wukongimjssdk'

export class SyncMessageOptions {
  constructor() {
    this.startMessageSeq = 0 // 开始消息列号（结果包含start_message_seq的消息）
    this.endMessageSeq = 0 // 结束消息列号（结果不包含end_message_seq的消息）0表示不限制
    this.limit = 30 // 每次限制数量
    this.pullMode = null // 拉取模式 0:向下拉取 1:向上拉取
  }
}

/**
 * IConversationProvider 接口
 * 会话提供者接口，定义了会话相关的数据操作方法
 *
 * 方法列表：
 * - syncMessages(channel: Channel, opts?: SyncMessageOptions): Promise<Array<Message>> // 同步消息
 * - syncMessageExtras(channel: Channel, version: number, limit: number): Promise<MessageExtra[]> // 同步消息扩展
 * - revokeMessage(message: Message): Promise<void> // 撤回消息
 * - editMessage(messageID: String, messageSeq: number, channelID: String, channelType: number, content: String): Promise<void> // 编辑消息
 * - markConversationUnread(channel: Channel, unread: number): Promise<void> // 设置最近会话未读数量
 * - deleteConversation(channel: Channel): Promise<void> // 删除最近会话
 * - clearConversationMessages(conversation: Conversation): Promise<void> // 清空某个最近会话的消息
 * - deleteMessages(messages: Message[]): Promise<void> // 删除消息
 */
