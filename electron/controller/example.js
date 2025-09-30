'use strict'

const { logger } = require('ee-core/log')
const { exampleService } = require('../service/example')
const { wkimService } = require('../service/wkim')

/**
 * example
 * @class
 */
class ExampleController {
  /**
   * 所有方法接收两个参数
   * @param args 前端传的参数
   * @param event - ipc通信时才有值。详情见：控制器文档
   */

  /**
   * test
   */
  async test() {
    const result = await exampleService.test('electron')
    logger.info('service result:', result)

    return 'hello electron-egg'
  }

  async connectTcp(args) {
    const json = JSON.parse(args)
    const result = await wkimService.connectTcp(json)

    return result
  }

  async sendText(args) {
    const json = JSON.parse(args)
    // const re
    const result = await wkimService.sendText(json)

    return result
  }
}
ExampleController.toString = () => '[class ExampleController]'

module.exports = ExampleController
