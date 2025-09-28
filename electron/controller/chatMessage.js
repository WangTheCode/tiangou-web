'use strict';

const { logger } = require('ee-core/log');
const { sqlitedbService } = require('../service/database/sqlitedb');
const { show } = require('../utils');
/**
 * example
 * @class
 */
class ChatMessageController {

 

  checkDataDir() {
      try {
        sqlitedbService.getDataDir();
        return true;
      } catch (err) {
        return false;
      }
  }

  async getMessagePageList (args) {
    if (!this.checkDataDir()) {
      return this.show(null, -1, '数据目录不存在');
    }

    const res = await sqlitedbService.getMessagePageList(args);
    return show(res);
  }

   
  async addMessage (args) {
    if (!this.checkDataDir()) {
      return this.show(null, -1, '数据目录不存在');
    }

    const res = await sqlitedbService.addChatMessage(args);
    return show(res);
  }

  
}
ChatMessageController.toString = () => '[class ChatMessageController]';

module.exports = ChatMessageController; 