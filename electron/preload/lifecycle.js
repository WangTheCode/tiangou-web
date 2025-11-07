'use strict'

const { logger } = require('ee-core/log')
const { getConfig } = require('ee-core/config')
const { getMainWindow } = require('ee-core/electron')
const { BrowserWindow } = require('electron')

class Lifecycle {
  /**
   * core app have been loaded
   */
  async ready() {
    logger.info('[lifecycle] ready')
  }

  /**
   * electron app ready
   */
  async electronAppReady() {
    logger.info('[lifecycle] electron-app-ready')
  }

  /**
   * main window have been loaded
   */
  async windowReady() {
    logger.info('[lifecycle] window-ready')
    // 延迟加载，无白屏
    const { windowsOption } = getConfig()
    if (windowsOption.show == false) {
      const win = getMainWindow()
      win.once('ready-to-show', () => {
        win.show()
        win.focus()
      })
    }

    // 保存 this 引用
    const self = this
    const mainWindow = BrowserWindow.getAllWindows().find(win => win.id === 1)
    mainWindow.on('close', async event => {
      // Prevent the window from closing immediately
      event.preventDefault()
      logger.info('main Window close')

      try {
        await self.handleClose()
        // 关闭主窗口
        mainWindow.destroy()
      } catch (error) {
        logger.error('[lifecycle] 窗口关闭时资源清理失败:', error)
        mainWindow.destroy()
      }
    })
  }

  async handleClose() {
    try {
      // 断开 IM 连接
      const { wkimService } = require('../service/wkim')
      if (wkimService && wkimService.sdk) {
        logger.info('[lifecycle] 断开 IM 连接')
        wkimService.sdk.disconnect()
      }

      // 关闭数据库连接
      const { sqlitedbService } = require('../service/database/chatMessagedb')
      if (sqlitedbService && sqlitedbService.db) {
        logger.info('[lifecycle] 关闭数据库连接')
        sqlitedbService.db.close()
      }

      logger.info('[lifecycle] 资源清理完成')
    } catch (error) {
      logger.error('[lifecycle] 资源清理失败:', error)
    }
  }

  /**
   * before app close
   */
  async beforeClose() {
    logger.info('[lifecycle] before-close')
    try {
      await this.handleClose()
    } catch (error) {
      logger.error('[lifecycle] 资源清理失败:', error)
    }

    // 确保以正常状态退出
    process.exit(0)
  }
}
Lifecycle.toString = () => '[class Lifecycle]'

module.exports = {
  Lifecycle,
}
