'use strict';

const {  BrowserWindow } = require("electron");

/**
 * 发送消息到web监听器
 * @class
 */
class WebService {

   
   setConnectStatus(status,reasonCode) {
    const channel = "controller.web.onConnectStatus";
    const mainWindow = BrowserWindow.getAllWindows().find((win) => win.id == 1);
    if (mainWindow) {
      mainWindow.webContents.send(channel, {
          status,
          reasonCode  
      });
    }
  }

}
WebService.toString = () => '[class WebService]';

module.exports = {
    WebService,
    webService: new WebService()
};