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
  addFaveMessage: '/favorites',
  updateGroupSetting: '/groups/{channelID}/setting',
  updateUserSetting: '/users/{channelID}/setting',
  closeConversation: '/conversations/{channelID}/{channelType}',
  getOssSts: '/file/oss/sts',
  clearChannelMessages: '/message/offset',
  syncContactList: '/friend/sync',
  searchGlobal: '/search/global',
  exitGroup: '/groups/{channelID}/exit',
  setFriendRemark: '/friend/remark',
  removeFriend: '/friends/{uid}',
  removeGroupBlacklist: '/groups/{channelID}/blacklist/remove',
  addGroupBlacklist: '/groups/{channelID}/blacklist/add',
  removeUserBlacklist: '/user/blacklist/{channelID}',
  addUserBlacklist: '/user/blacklist/{channelID}',
  getGroupUserChannelInfo: '/users/{uid}',
  forbiddenWithMember: '/groups/{groupNo}/forbidden_with_member',
  getGroupForbiddenTimes: '/group/forbidden_times',
  updateGroup: '/groups/{groupNo}',
  updateGroupMember: '/groups/{groupNo}/members/{uid}',
  updateGroupAvatar: '/groups/{groupNo}/avatar',
  getGroupQrcode: '/groups/{groupNo}/qrcode',
  transferGroupOwner: '/groups/{groupNo}/transfer/{uid}',
  removeGroupAdmin: '/groups/{channelID}/managers',
  addGroupAdmin: '/groups/{channelID}/managers',
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
  static addFaveMessage = async (data) => post({ url: URLS.addFaveMessage, data })
  static updateGroupSetting = async (data) =>
    put({ url: getUrl(URLS.updateGroupSetting, data), data: data.setting })
  static updateUserSetting = async (data) =>
    put({ url: getUrl(URLS.updateUserSetting, data), data: data.setting })
  static closeConversation = async (data) => del({ url: getUrl(URLS.closeConversation, data) })
  static getOssSts = async () => get({ url: URLS.getOssSts })
  static clearChannelMessages = async (data) => post({ url: URLS.clearChannelMessages, data })
  static syncContactList = async (params) => get({ url: URLS.syncContactList, params })
  static searchGlobal = async (data) => post({ url: URLS.searchGlobal, data })
  static exitGroup = async (data) => post({ url: getUrl(URLS.exitGroup, data) })
  static setFriendRemark = async (data) => put({ url: URLS.setFriendRemark, data })
  static removeFriend = async (data) => del({ url: getUrl(URLS.removeFriend, data) })
  static removeGroupBlacklist = async (data) =>
    post({ url: getUrl(URLS.removeGroupBlacklist, data), data: { uids: data.uids } })
  static addGroupBlacklist = async (data) =>
    post({ url: getUrl(URLS.addGroupBlacklist, data), data: { uids: data.uids } })
  static removeUserBlacklist = async (data) => del({ url: getUrl(URLS.removeUserBlacklist, data) })
  static addUserBlacklist = async (data) => post({ url: getUrl(URLS.addUserBlacklist, data) })
  static getGroupUserChannelInfo = async (params) =>
    get({
      url: getUrl(URLS.getGroupUserChannelInfo, params),
      params: { group_no: params.group_no },
    })
  static forbiddenWithMember = async (data) =>
    post({ url: getUrl(URLS.forbiddenWithMember, data), data })
  static getGroupForbiddenTimes = async () => get({ url: URLS.getGroupForbiddenTimes })
  static updateGroup = async (data) => put({ url: getUrl(URLS.updateGroup, data), data })
  static updateGroupMember = async (data) =>
    put({ url: getUrl(URLS.updateGroupMember, data), data })
  static updateGroupAvatar = async (data) => {
    const formData = new FormData()
    formData.append('file', data.file)
    const params = {
      groupNo: data.groupNo,
    }
    return post({ url: getUrl(URLS.updateGroupAvatar, params), data: formData })
  }
  static getGroupQrcode = async (params) => get({ url: getUrl(URLS.getGroupQrcode, params) })
  static transferGroupOwner = async (data) => post({ url: getUrl(URLS.transferGroupOwner, data) })
  static removeGroupAdmin = async (data) =>
    del({ url: getUrl(URLS.removeGroupAdmin, data), data: data.uids })
  static addGroupAdmin = async (data) =>
    post({ url: getUrl(URLS.addGroupAdmin, data), data: data.uids })
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
