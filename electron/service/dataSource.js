'use strict';

const { logger } = require('ee-core/log');
const { post } = require('../utils/http');
const { Convert } = require('./tsddConvert');
const { WKSDK } = require('wukongimjstcpsdk');
/**
 * 示例服务
 * @class
 */
class DataSourceService {

   
  async setSyncConversationsCallback(sdk) {
    sdk.config.provider.syncConversationsCallback = async (filter) => {
      let resp = null;
      let conversations = [];
      // 模拟从服务器获取会话列表
      // 在实际应用中，这里应该调用API获取真实的会话数据
      resp = await post('conversation/sync',{ "msg_count": 1 })
      if (resp) {
          resp.conversations.forEach((conversationMap) => {
              let model = Convert.toConversation(conversationMap);
              conversations.push(model);
          });
          const users = resp.users
          if (users && users.length > 0) {
              for (const user of users) {
                  sdk.channelManager.setChannleInfoForCache(Convert.userToChannelInfo(user))
              }
          }
          const groups = resp.groups
          if (groups && groups.length > 0) {
              for (const group of groups) {
                  sdk.channelManager.setChannleInfoForCache(Convert.groupToChannelInfo(group))
              }
          }
      }
      logger.info('conversations', JSON.stringify(conversations));
      return conversations
 
    };
  }
}
DataSourceService.toString = () => '[class DataSourceService]';

module.exports = {
  DataSourceService,
  dataSourceService: new DataSourceService()
};