/*************************************************
 ** preload为预加载模块，该文件将会在程序启动时加载 **
 *************************************************/

 const { logger } = require('ee-core/log');
 const { trayService } = require("../addon/tray");
 const { sqlitedbService } = require('../service/database/sqlitedb');

 function preload() {
   logger.info('[preload] load 1');
   trayService.create();
   sqlitedbService.init();
 }
 
 /**
 * 预加载模块入口
 */
 module.exports = {
   preload
 }