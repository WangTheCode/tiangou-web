import { post, get, put, del } from '../utils/http/axios'
import { getUrl } from './index'
export const URLS = {
  reminderSync: '/message/reminder/sync',
  syncConversationList: '/conversation/sync',
  syncChannelMessageList: '/message/channel/sync',
  getChannelInfo: '/channels/{channelID}/{channelType}',
  clearUnread: 'coversation/clearUnread',
  syncSubscribers: '/groups/{channelID}/membersync',
  deleteMessages: '/message',
  syncFriendList: '/friend/sync',
}

export default class chatApi {
  static reminderSync = async (data) => post({ url: URLS.reminderSync, data })
  static syncConversationList = async (data) => post({ url: URLS.syncConversationList, data })
  static syncChannelMessageList = async (data) => post({ url: URLS.syncChannelMessageList, data })
  static getChannelInfo = async (data) => get({ url: getUrl(URLS.getChannelInfo, data) })
  static clearUnread = async (data) => put({ url: URLS.clearUnread, data })
  static syncSubscribers = async (data) =>
    get({ url: getUrl(URLS.syncSubscribers, data), params: data })
  static deleteMessages = async (data) => del({ url: URLS.deleteMessages, data })
  static syncFriendList = async (params) => get({ url: URLS.syncFriendList, params })
}

// const apis = {}
// for (const key in URLS) {
//   let url = URLS[key]
//   apis[key] = (data, option = {}) => {
//     if (url.indexOf('{') !== -1) {
//       for (const key in data) {
//         url = url.replace(`{${key}}`, data[key])
//       }
//     }
//     return post({ url, data, ...option })
//   }
// }
// export default apis
