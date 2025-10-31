'use strict'

const { BasedbService } = require('./basedb')

/**
 * sqlite数据存储
 * @class
 */
class SqlitedbService extends BasedbService {
  constructor() {
    const options = {
      dbname: 'sqlite-tiangou.db',
    }
    super(options)
    this.chatMessagesTableName = 'chat_messages'
  }

  /*
   * 初始化
   */
  init() {
    // 初始化数据库
    this._init()

    // 检查表是否存在
    const masterStmt = this.db.prepare('SELECT * FROM sqlite_master WHERE type=? AND name = ?')
    let tableExists = masterStmt.get('table', this.chatMessagesTableName)
    if (!tableExists) {
      // 创建聊天消息表
      const create_table_sql = `CREATE TABLE ${this.chatMessagesTableName}
      (
         id INTEGER PRIMARY KEY AUTOINCREMENT,
         message_id TEXT NOT NULL,
         message_seq INTEGER NOT NULL,
         client_msg_no TEXT NOT NULL,
         from_uid TEXT NOT NULL,
         channel_id TEXT NOT NULL,
         channel_type INTEGER NOT NULL,
         timestamp INTEGER NOT NULL,
         header TEXT NOT NULL,
         payload TEXT NOT NULL,
         payload_type INTEGER,
         message_content TEXT,
         signal_payload TEXT,
         setting INTEGER NOT NULL DEFAULT 0,
         is_deleted INTEGER NOT NULL DEFAULT 0,
         readed INTEGER NOT NULL DEFAULT 0,
         extra_version INTEGER NOT NULL DEFAULT 0,
         created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
      );`
      this.db.exec(create_table_sql)

      // 创建索引以优化查询性能
      const create_indexes_sql = `
        CREATE INDEX idx_channel ON ${this.chatMessagesTableName}(channel_id, channel_type);
        CREATE INDEX idx_message_id ON ${this.chatMessagesTableName}(message_id);
        CREATE INDEX idx_timestamp ON ${this.chatMessagesTableName}(timestamp DESC);
        CREATE INDEX idx_message_seq ON ${this.chatMessagesTableName}(channel_id, channel_type, message_seq);
      `
      this.db.exec(create_indexes_sql)
    }
  }

  /*
   * 增 - 添加聊天消息
   */
  async addChatMessage(messageData) {
    // 提取 payload 中的 content 和 type
    let messageContent = null
    let payloadType = null
    if (messageData.payload) {
      const payload =
        typeof messageData.payload === 'string'
          ? JSON.parse(messageData.payload)
          : messageData.payload
      messageContent = payload.content || null
      payloadType = payload.type || null
    }

    // 转换 header 和 payload 为字符串
    const headerStr =
      typeof messageData.header === 'string'
        ? messageData.header
        : JSON.stringify(messageData.header || {})
    const payloadStr =
      typeof messageData.payload === 'string'
        ? messageData.payload
        : JSON.stringify(messageData.payload || {})

    const insert = this.db.prepare(`
      INSERT INTO ${this.chatMessagesTableName} 
      (message_id, message_seq, client_msg_no, from_uid, channel_id, channel_type, 
       timestamp, header, payload, payload_type, message_content, signal_payload, 
       setting, is_deleted, readed, extra_version)
      VALUES 
      (@message_id, @message_seq, @client_msg_no, @from_uid, @channel_id, @channel_type,
       @timestamp, @header, @payload, @payload_type, @message_content, @signal_payload,
       @setting, @is_deleted, @readed, @extra_version)
    `)

    insert.run({
      message_id: messageData.message_idstr || String(messageData.message_id),
      message_seq: messageData.message_seq,
      client_msg_no: messageData.client_msg_no,
      from_uid: messageData.from_uid,
      channel_id: messageData.channel_id,
      channel_type: messageData.channel_type,
      timestamp: messageData.timestamp,
      header: headerStr,
      payload: payloadStr,
      payload_type: payloadType,
      message_content: messageContent,
      signal_payload: messageData.signal_payload || '',
      setting: messageData.setting || 0,
      is_deleted: messageData.is_deleted || 0,
      readed: messageData.readed || 0,
      extra_version: messageData.extra_version || 0,
    })
    return true
  }

  /*
   * 删 - 根据消息ID删除消息
   */
  async delChatMessage(messageId) {
    const delInfo = this.db.prepare(
      `DELETE FROM ${this.chatMessagesTableName} WHERE message_id = ?`
    )
    delInfo.run(messageId)
    return true
  }

  /*
   * 改 - 更新消息状态（如已读状态）
   */
  async updateChatMessageStatus(messageId, updates) {
    const fields = []
    const params = {}

    if (updates.readed !== undefined) {
      fields.push('readed = @readed')
      params.readed = updates.readed
    }
    if (updates.is_deleted !== undefined) {
      fields.push('is_deleted = @is_deleted')
      params.is_deleted = updates.is_deleted
    }

    if (fields.length === 0) return false

    const updateInfo = this.db.prepare(
      `UPDATE ${this.chatMessagesTableName} SET ${fields.join(', ')} WHERE message_id = @message_id`
    )
    params.message_id = messageId
    updateInfo.run(params)
    return true
  }

  /*
   * 查 - 根据会话ID和类型获取消息列表
   */
  async getMessagesByChannel(channelId, channelType, options = {}) {
    const { limit = 20, offset = 0, order = 'DESC' } = options

    const selectMessages = this.db.prepare(`
      SELECT * FROM ${this.chatMessagesTableName} 
      WHERE channel_id = @channel_id AND channel_type = @channel_type
      ORDER BY timestamp ${order}
      LIMIT @limit OFFSET @offset
    `)
    const messages = selectMessages.all({
      channel_id: channelId,
      channel_type: channelType,
      limit,
      offset,
    })
    return messages
  }

  /*
   * 查 - 根据消息内容搜索
   */
  async searchMessages(keyword, channelId = null, channelType = null) {
    let sql = `SELECT * FROM ${this.chatMessagesTableName} WHERE message_content LIKE @keyword`
    const params = { keyword: `%${keyword}%` }

    if (channelId && channelType !== null) {
      sql += ' AND channel_id = @channel_id AND channel_type = @channel_type'
      params.channel_id = channelId
      params.channel_type = channelType
    }

    sql += ' ORDER BY timestamp DESC'

    const selectMessages = this.db.prepare(sql)
    const messages = selectMessages.all(params)
    return messages
  }

  /*
   * 查 - 根据消息ID获取单条消息
   */
  async getMessageById(messageId) {
    const selectMessage = this.db.prepare(
      `SELECT * FROM ${this.chatMessagesTableName} WHERE message_id = @message_id`
    )
    const message = selectMessage.get({ message_id: messageId })
    return message
  }

  /*
   * 查 - 获取分页消息列表
   */
  async getMessagePageList(options = {}) {
    const { limit = 50, offset = 0 } = options
    const selectAllMessages = this.db.prepare(`
      SELECT * FROM ${this.chatMessagesTableName} 
      ORDER BY timestamp DESC
      LIMIT @limit OFFSET @offset
    `)
    const messages = selectAllMessages.all({ limit, offset })
    return messages
  }

  /*
   * get data dir (sqlite)
   */
  async getDataDir() {
    const dir = this.storage.getDbDir()
    return dir
  }

  /*
   * set custom data dir (sqlite)
   */
  async setCustomDataDir(dir) {
    if (!dir) {
      return
    }

    this.changeDataDir(dir)
    this.init()
    return
  }
}
SqlitedbService.toString = () => '[class SqlitedbService]'

module.exports = {
  SqlitedbService,
  sqlitedbService: new SqlitedbService(),
}
