'use strict';

const { logger } = require('ee-core/log');
const { wkimService } = require('../service/wkim');
const { show,getJson } = require('../utils');

/**
 * ChatManage
 * @class
 */
class ChatManageController {
 


  async connectTcp (args) {
    const json = JSON.parse(args);
    const result = await wkimService.connectTcp(json);

    return show(result);
  }

  async syncConversationList (args) {
    const json = JSON.parse(args);
    const result = await wkimService.syncConversationList(json);
    return show(result);
  }

  async setImConfig (args) {
    const json = getJson(args);
    wkimService.setImConfig(json);
    return show(true);
  }

 
}
ChatManageController.toString = () => '[class ChatManageController]';

module.exports = ChatManageController; 