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
         conversation_id TEXT NOT NULL,
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
        CREATE UNIQUE INDEX idx_unique_message_id ON ${this.chatMessagesTableName}(message_id);
        CREATE INDEX idx_conversation ON ${this.chatMessagesTableName}(conversation_id);
        CREATE INDEX idx_timestamp ON ${this.chatMessagesTableName}(timestamp DESC);
        CREATE INDEX idx_message_seq ON ${this.chatMessagesTableName}(conversation_id, message_seq);
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

    // 生成 conversation_id
    const conversationId = `${messageData.channel_id}_${messageData.channel_type}`

    const insert = this.db.prepare(`
      INSERT INTO ${this.chatMessagesTableName} 
      (message_id, message_seq, client_msg_no, from_uid, channel_id, channel_type, conversation_id,
       timestamp, header, payload, payload_type, message_content, signal_payload, 
       setting, is_deleted, readed, extra_version)
      VALUES 
      (@message_id, @message_seq, @client_msg_no, @from_uid, @channel_id, @channel_type, @conversation_id,
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
      conversation_id: conversationId,
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
   * 删 - 清空频道消息
   */
  async delChatMessagesByChannel(channelId, channelType, messageSeq) {
    const conversationId = `${channelId}_${channelType}`
    const delInfo = this.db.prepare(
      `DELETE FROM ${this.chatMessagesTableName} WHERE conversation_id = ? AND message_seq < ?`
    )
    delInfo.run(conversationId, messageSeq)
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
    const conversationId = `${channelId}_${channelType}`

    const selectMessages = this.db.prepare(`
      SELECT * FROM ${this.chatMessagesTableName} 
      WHERE conversation_id = @conversation_id
      ORDER BY timestamp ${order}
      LIMIT @limit OFFSET @offset
    `)
    const messages = selectMessages.all({
      conversation_id: conversationId,
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
      const conversationId = `${channelId}_${channelType}`
      sql += ' AND conversation_id = @conversation_id'
      params.conversation_id = conversationId
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
   * 查 - 按 message_seq 范围查询消息（用于同步逻辑）
   */
  async getMessagesBySeqRange(channelId, channelType, startSeq, endSeq, limit) {
    const conversationId = `${channelId}_${channelType}`
    let sql = `SELECT * FROM ${this.chatMessagesTableName} 
               WHERE conversation_id = @conversation_id`
    const params = {
      conversation_id: conversationId,
      limit: limit,
    }

    // 根据 start_seq 和 end_seq 的值构建查询条件
    if (startSeq === 0 && endSeq === 0) {
      // 获取最新的 limit 条消息
      sql += ' ORDER BY message_seq DESC LIMIT @limit'
    } else if (startSeq === 0 && endSeq > 0) {
      // 获取 seq < end_seq 的消息
      sql += ' AND message_seq < @end_seq ORDER BY message_seq DESC LIMIT @limit'
      params.end_seq = endSeq
    } else if (startSeq > 0 && endSeq === 0) {
      // 获取 seq > start_seq 的消息
      sql += ' AND message_seq > @start_seq ORDER BY message_seq ASC LIMIT @limit'
      params.start_seq = startSeq
    } else if (startSeq > 0 && endSeq > 0) {
      // 获取 start_seq < seq < end_seq 的消息
      sql +=
        ' AND message_seq > @start_seq AND message_seq < @end_seq ORDER BY message_seq ASC LIMIT @limit'
      params.start_seq = startSeq
      params.end_seq = endSeq
    }

    const selectMessages = this.db.prepare(sql)
    const messages = selectMessages.all(params)
    return messages
  }

  /*
   * 批量插入消息（去重，使用事务优化性能）
   */
  async batchInsertMessages(conversationId, messages) {
    if (!messages || messages.length === 0) return 0

    const insertStmt = this.db.prepare(`
      INSERT OR IGNORE INTO ${this.chatMessagesTableName} 
      (message_id, message_seq, client_msg_no, from_uid, channel_id, channel_type, conversation_id,
       timestamp, header, payload, payload_type, message_content, signal_payload, 
       setting, is_deleted, readed, extra_version)
      VALUES 
      (@message_id, @message_seq, @client_msg_no, @from_uid, @channel_id, @channel_type, @conversation_id,
       @timestamp, @header, @payload, @payload_type, @message_content, @signal_payload,
       @setting, @is_deleted, @readed, @extra_version)
    `)

    // 使用事务批量插入
    const insertMany = this.db.transaction(msgs => {
      let insertedCount = 0
      for (const msg of msgs) {
        // 提取 payload 中的 content 和 type
        let messageContent = null
        let payloadType = null
        if (msg.payload) {
          const payload = typeof msg.payload === 'string' ? JSON.parse(msg.payload) : msg.payload
          messageContent = payload.content || null
          payloadType = payload.type || null
        }

        // 转换 header 和 payload 为字符串
        const headerStr =
          typeof msg.header === 'string' ? msg.header : JSON.stringify(msg.header || {})
        const payloadStr =
          typeof msg.payload === 'string' ? msg.payload : JSON.stringify(msg.payload || {})

        const result = insertStmt.run({
          message_id: msg.message_idstr || String(msg.message_id),
          message_seq: msg.message_seq,
          client_msg_no: msg.client_msg_no,
          from_uid: msg.from_uid,
          channel_id: msg.channel_id,
          channel_type: msg.channel_type,
          conversation_id: conversationId,
          timestamp: msg.timestamp,
          header: headerStr,
          payload: payloadStr,
          payload_type: payloadType,
          message_content: messageContent,
          signal_payload: msg.signal_payload || '',
          setting: msg.setting || 0,
          is_deleted: msg.is_deleted || 0,
          readed: msg.readed || 0,
          extra_version: msg.extra_version || 0,
        })
        if (result.changes > 0) insertedCount++
      }
      return insertedCount
    })

    return insertMany(messages)
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
