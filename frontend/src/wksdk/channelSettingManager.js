import { ChannelTypeGroup, ChannelTypePerson } from 'wukongimjssdk'
import chatApi from '@/api/chat'

export const updateSetting = (setting, channel) => {
  if (channel.channelType === ChannelTypeGroup) {
    return chatApi.updateGroupSetting({
      channelID: channel.channelID,
      setting: setting,
    })
  } else if (channel.channelType === ChannelTypePerson) {
    // 个人信息
    return chatApi.updateUserSetting({
      channelID: channel.channelID,
      setting: setting,
    })
  }
}

export const mute = (v, channel) => {
  return updateSetting({ mute: v ? 1 : 0 }, channel)
}

export const top = (v, channel) => {
  return updateSetting({ top: v ? 1 : 0 }, channel)
}

export const save = (v, channel) => {
  return updateSetting({ save: v ? 1 : 0 }, channel)
}

export const invite = (v, channel) => {
  return updateSetting({ invite: v ? 1 : 0 }, channel)
}

export const remark = (remark, channel) => {
  return updateSetting({ remark: remark }, channel)
}

// 消息回执
export const receipt = (v, channel) => {
  return updateSetting({ receipt: v ? 1 : 0 }, channel)
}

// 频道禁言
export const forbidden = (v, channel) => {
  return updateSetting({ forbidden: v ? 1 : 0 }, channel)
}
// 禁止互加好友
export const forbiddenAddFriend = (v, channel) => {
  return updateSetting({ forbidden_add_friend: v ? 1 : 0 }, channel)
}

// 允许新成员查看历史消息
export const allowViewHistoryMsg = (v, channel) => {
  return updateSetting({ allow_view_history_msg: v ? 1 : 0 }, channel)
}
// 允许群成员置顶消息
export const allowMemberPinnedMessage = (v, channel) => {
  return updateSetting({ allow_member_pinned_message: v ? 1 : 0 }, channel)
}
