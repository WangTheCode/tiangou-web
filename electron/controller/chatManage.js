'use strict'

const { logger } = require('ee-core/log')
const { wkimService } = require('../service/wkim')
const { show, getJson } = require('../utils')

/**
 * ChatManage
 * @class
 */
class ChatManageController {
  async connectTcp(args) {
    const json = JSON.parse(args)
    const result = await wkimService.connectTcp(json)

    return show(result)
  }

  async syncConversationList(args) {
    const json = JSON.parse(args)
    const result = await wkimService.syncConversationList(json)
    return show(result)
  }

  async setImConfig(args) {
    const json = getJson(args)
    wkimService.setImConfig(json)
    return show(true)
  }
  async sendMessage(args) {
    const json = getJson(args)
    const result = await wkimService.sendMessage(json)
    return show(result)
  }
  async syncChannelMessageList(args) {
    const json = getJson(args)
    const result = await wkimService.syncChannelMessageList(json)
    return show(result)
  }
  async setOpenConversation(args) {
    const json = getJson(args)
    wkimService.setOpenConversation(json)
    return show(true)
  }
  async clearChannelMessages(args) {
    const json = getJson(args)
    const result = await wkimService.clearChannelMessages(json)
    return show(result)
  }
}
ChatManageController.toString = () => '[class ChatManageController]'

module.exports = ChatManageController
