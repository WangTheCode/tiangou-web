import WKSDK, { ChannelInfo, ChannelTypePerson, ChannelTypeGroup } from 'wukongimjssdk'
import chatApi from '@/api/chat'
import { newChannel } from '@/wksdk/channelManager'
import { Convert } from '@/wksdk/dataConvert'

export const setChannelInfoCallback = () => {
  WKSDK.shared().config.provider.channelInfoCallback = async function (channel) {
    let channelInfo = new ChannelInfo(),
      isUsers = channel.channelType === ChannelTypePerson
    const resp = await chatApi.getChannelInfo(channel)
    const data = resp

    channelInfo.channel = newChannel(data.channel.channel_id, data.channel.channel_type)
    channelInfo.title = data.name
    channelInfo.mute = data.mute === 1
    channelInfo.top = data.stick === 1
    channelInfo.online = data.online === 1
    channelInfo.lastOffline = data.last_offline
    channelInfo.logo = data.logo
    if (!channelInfo.logo || channelInfo.logo === '') {
      if (channel.channelType === ChannelTypePerson) {
        channelInfo.logo = `users/${channel.channelID}/avatar`
      } else if (channel.channelType === ChannelTypeGroup) {
        channelInfo.logo = `groups/${channel.channelID}/avatar`
      }
    }

    channelInfo.orgData = data.extra || {}
    channelInfo.orgData.remark = data.remark ?? ''
    channelInfo.orgData.displayName =
      data.remark && data.remark !== '' ? data.remark : channelInfo.title

    channelInfo.orgData.receipt = data.receipt
    channelInfo.orgData.robot = data.robot
    channelInfo.orgData.status = data.status
    channelInfo.orgData.follow = data.follow
    channelInfo.orgData.category = data.category
    channelInfo.orgData.be_deleted = data.be_deleted
    channelInfo.orgData.be_blacklist = data.be_blacklist
    channelInfo.orgData.notice = data.notice

    if (channel.channelType === ChannelTypePerson) {
      channelInfo.orgData.shortNo = data.extra.short_no ?? ''
    } else if (channel.channelType === ChannelTypeGroup) {
      channelInfo.orgData.forbidden = data.forbidden
      channelInfo.orgData.invite = data.invite
      channelInfo.orgData.forbiddenAddFriend = data.extra.forbidden_add_friend
      channelInfo.orgData.save = data.save
    }
    if (data.category === 'system' || data.category === 'customerService') {
      // 官方账号
      channelInfo.orgData.identityIcon = './identity_icon/official.png'
      channelInfo.orgData.identitySize = { width: '18px', height: '18px' }
    } else if (data.category === 'visitor') {
      channelInfo.orgData.identityIcon = './identity_icon/visitor.png'
      channelInfo.orgData.identitySize = { width: '48px', height: '24px' }
    }

    return channelInfo
  }
}

export const handleSyncConversations = (data) => {
  let conversations = []
  if (data) {
    // 先将 channelInfo 添加到 channelManager 缓存
    const users = data.users
    if (users && users.length > 0) {
      for (const user of users) {
        WKSDK.shared().channelManager.setChannleInfoForCache(Convert.userToChannelInfo(user))
      }
    }
    const groups = data.groups
    if (groups && groups.length > 0) {
      for (const group of groups) {
        WKSDK.shared().channelManager.setChannleInfoForCache(Convert.groupToChannelInfo(group))
      }
    }

    // 然后再创建 conversation 对象（此时 channelInfo 已经在缓存中）
    data.conversations.forEach((conversationMap) => {
      let model = Convert.toConversation(conversationMap)
      conversations.push(model)
    })

    // 过滤敏感词
    // const conversationWraps = []
    // if (conversations && conversations.length > 0) {
    //   for (const conversation of conversations) {
    //     if (
    //       conversation.lastMessage?.content &&
    //       conversation.lastMessage?.contentType == MessageContentType.text
    //     ) {
    //       conversation.lastMessage.content.text = ProhibitwordsService.shared.filter(
    //         conversation.lastMessage.content.text
    //       )
    //     }
    //     conversationWraps.push(conversation)
    //   }
    // }
  }
  return conversations
}

export const setSyncConversationsCallback = () => {
  WKSDK.shared().config.provider.syncConversationsCallback = async (filter) => {
    const resp = await chatApi.syncConversationList({ msg_count: 1 })
    // let conversations = []
    // if (resp) {
    //   // 先将 channelInfo 添加到 channelManager 缓存
    //   const users = resp.users
    //   if (users && users.length > 0) {
    //     for (const user of users) {
    //       WKSDK.shared().channelManager.setChannleInfoForCache(Convert.userToChannelInfo(user))
    //     }
    //   }
    //   const groups = resp.groups
    //   if (groups && groups.length > 0) {
    //     for (const group of groups) {
    //       WKSDK.shared().channelManager.setChannleInfoForCache(Convert.groupToChannelInfo(group))
    //     }
    //   }

    //   // 然后再创建 conversation 对象（此时 channelInfo 已经在缓存中）
    //   resp.conversations.forEach(conversationMap => {
    //     let model = Convert.toConversation(conversationMap)
    //     conversations.push(model)
    //   })
    // }

    return handleSyncConversations(resp)
  }
}
