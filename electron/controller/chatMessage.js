'use strict';

const { logger } = require('ee-core/log');
const { sqlitedbService } = require('../service/database/sqlitedb');
/**
 * example
 * @class
 */
class ChatMessageController {

  /**
   * 所有方法接收两个参数
   * @param args 前端传的参数
   * @param event - ipc通信时才有值。详情见：控制器文档
   */

  show(data, code = 0, message = 'success') {
    return {
      code: code,
      data: data,
      message: message
    }
  }

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
    return this.show(res);
  }

   
  async addMessage (args) {
    if (!this.checkDataDir()) {
      return this.show(null, -1, '数据目录不存在');
    }

    const res = await sqlitedbService.addChatMessage(args);
    return this.show(res);
  }
}
ChatMessageController.toString = () => '[class ChatMessageController]';

module.exports = ChatMessageController; 