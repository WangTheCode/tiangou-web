'use strict';

const { logger } = require('ee-core/log');
const { wkimService } = require('../service/wkim');

/**
 * Wkim
 * @class
 */
class WkimController {
 


  async connectTcp (args) {
    const json = JSON.parse(args);
    const result = await wkimService.connectTcp(json);

    return result;
  }

 
}
WkimController.toString = () => '[class WkimController]';

module.exports = WkimController; 