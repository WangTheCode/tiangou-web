import WKSDK, { ChannelInfo, ChannelTypePerson, ChannelTypeGroup, Subscriber } from 'wukongimjssdk'
import chatApi from '@/api/chat'
import { newChannel, avatarUser, fetchChannelInfoSync } from '@/wksdk/channelManager'
import { Convert } from '@/wksdk/dataConvert'
import { GroupRole } from '@/wksdk/const'
import { useChatStore } from '@/stores/index'

// 全局 channelInfo 监听器（仅注册一次）
let channelInfoListenerRegistered = false

export const registerGlobalChannelInfoListener = () => {
  if (channelInfoListenerRegistered) {
    return
  }

  const listener = (channelInfo) => {
    // 当任何 channelInfo 更新时，通知 Store 触发组件更新
    const chatStore = useChatStore()
    chatStore.triggerChannelInfoUpdate()
  }

  WKSDK.shared().channelManager.addListener(listener)
  channelInfoListenerRegistered = true
}

export const setChannelInfoCallback = () => {
  WKSDK.shared().config.provider.channelInfoCallback = async function (channel) {
    const channelInfo = await fetchChannelInfoSync(channel)
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
    console.log('conversations----->', conversations)

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
  WKSDK.shared().config.provider.syncConversationsCallback = async () => {
    const resp = await chatApi.syncConversationList({ msg_count: 1 })

    return handleSyncConversations(resp)
  }
}

export const setSyncSubscribersCallback = () => {
  WKSDK.shared().config.provider.syncSubscribersCallback = async function (channel, version) {
    const resp = await chatApi.syncSubscribers({
      channelID: channel.channelID,
      version: version,
      limit: 10000,
    })
    let members = []
    if (resp) {
      for (let i = 0; i < resp.length; i++) {
        let memberMap = resp[i]
        let member = new Subscriber()
        member.uid = memberMap.uid
        member.name = memberMap.name
        member.remark = memberMap.remark
        member.role = memberMap.role
        member.version = memberMap.version
        member.isDeleted = memberMap.is_deleted
        member.status = memberMap.status
        member.orgData = memberMap
        member.avatar = avatarUser(member.uid)
        members.push(member)
      }
    }
    members.sort((a, b) => {
      var roleA = a.role === GroupRole.owner ? 999 : a.role
      var roleB = b.role === GroupRole.owner ? 999 : b.role
      return roleB - roleA
    })
    return members
  }
}

// 消息上传任务
export const setMessageUploadTaskCallback = () => {
  WKSDK.shared().config.provider.messageUploadTaskCallback = (message) => {
    // return new MediaMessageUploadTask(message)
  }
}
