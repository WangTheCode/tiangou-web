const { post } = require('../utils/http')
const { Convert } = require('./dataConvert')
const { WKSDK, Subscriber } = require('wukongimjstcpsdk')
const { webService } = require('../service/web')

function setSyncConversationsCallback() {
  WKSDK.shared().config.provider.syncConversationsCallback = async filter => {
    let resp = null
    let conversations = []
    // 模拟从服务器获取会话列表
    // 在实际应用中，这里应该调用API获取真实的会话数据
    resp = await post('conversation/sync', { msg_count: 1 })
    if (resp && resp.data && resp.data.conversations) {
      webService.syncConversationList(resp.data)
      const users = resp.data.users
      if (users && users.length > 0) {
        for (const user of users) {
          WKSDK.shared().channelManager.setChannleInfoForCache(Convert.userToChannelInfo(user))
        }
      }
      const groups = resp.data.groups
      if (groups && groups.length > 0) {
        for (const group of groups) {
          WKSDK.shared().channelManager.setChannleInfoForCache(Convert.groupToChannelInfo(group))
        }
      }

      // 然后再创建 conversation 对象（此时 channelInfo 已经在缓存中）
      resp.data.conversations.forEach(conversationMap => {
        let model = Convert.toConversation(conversationMap)
        conversations.push(model)
      })
    }

    return conversations
  }
}

module.exports = {
  setSyncConversationsCallback,
}
