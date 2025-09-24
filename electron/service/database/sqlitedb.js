'use strict';

const { BasedbService } = require('./basedb');

/**
 * sqlite数据存储
 * @class
 */
class SqlitedbService extends BasedbService {

  constructor () {
    const options = {
      dbname: 'sqlite-tiangou.db',
    }
    super(options);
    this.chatMessagesTableName = 'chat_messages';
  }

  /*
   * 初始化
   */
  init() {
    // 初始化数据库
    this._init();

    // 检查表是否存在
    const masterStmt = this.db.prepare('SELECT * FROM sqlite_master WHERE type=? AND name = ?');
    let tableExists = masterStmt.get('table', this.chatMessagesTableName);
    if (!tableExists) {
      // 创建表
      const create_user_table_sql =
      `CREATE TABLE ${this.chatMessagesTableName}
      (
         id INTEGER PRIMARY KEY AUTOINCREMENT,
         nickname CHAR(50) NOT NULL,
         content TEXT NOT NULL
      );`
      this.db.exec(create_user_table_sql);
    }
  }

  /*
   * 增 Test data (sqlite)
   */
  async addChatMessage(data) {
    const insert = this.db.prepare(`INSERT INTO ${this.chatMessagesTableName} (nickname, content) VALUES (@nickname, @content)`);
    insert.run(data);
    return true;
  }

  /*
   * 删 Test data (sqlite)
   */
  async delChatMessage(id = '') {
    const delInfo = this.db.prepare(`DELETE FROM ${this.chatMessagesTableName} WHERE id = ?`);
    delInfo.run(id);
    return true;
  }

  /*
   * 改 Test data (sqlite)
   */
  async updateChatMessage(data) {
    const updateInfo = this.db.prepare(`UPDATE ${this.chatMessagesTableName} SET nickname = @nickname, content = @content WHERE id = @id`);
    updateInfo.run(data);
    return true;
  }  

  /*
   * 查 Test data (sqlite)
   */
  async getChatMessage(keyword = '') {
    const selectUser = this.db.prepare(`SELECT * FROM ${this.chatMessagesTableName} WHERE content = @content`);
    const users = selectUser.all({content: keyword});
    return users;
  }  
  
  /*
   * all Test data (sqlite)
   */
  async getMessagePageList() {
    const selectAllUser = this.db.prepare(`SELECT * FROM ${this.chatMessagesTableName} `);
    const allUser =  selectAllUser.all();
    return allUser;
  }
  
  /*
   * get data dir (sqlite)
   */
  async getDataDir() {
    const dir = this.storage.getDbDir();    
    return dir;
  } 

  /*
   * set custom data dir (sqlite)
   */
  async setCustomDataDir(dir) {
    if (!dir) {
      return;
    }

    this.changeDataDir(dir);
    this.init();
    return;
  }
}
SqlitedbService.toString = () => '[class SqlitedbService]';

module.exports = {
  SqlitedbService,
  sqlitedbService: new SqlitedbService()
};
