import {
  WKSDK,
  Channel,
  ChannelTypePerson,
  ConnectStatus,
  ChannelTypeGroup,
  ChannelInfo,
} from 'wukongimjssdk'
import { useChatStore } from '@/stores/index'
import Cache from '@/utils/cache'
import chatApi from '@/api/chat'

export const newChannel = (channelID, channelType = ChannelTypePerson) => {
  return new Channel(channelID, channelType)
}

export const getChannelInfo = (channel) => {
  if (!channel.getChannelKey) {
    channel = newChannel(channel.channelID, channel.channelType)
  }
  return WKSDK.shared().channelManager.getChannelInfo(channel)
}

export const fetchChannelInfo = (channel) => {
  // return WKSDK.shared().channelManager.fetchChannelInfo(channel)
  return new Promise((resolve) => {
    fetchChannelInfoSync(channel).then((res) => {
      WKSDK.shared().channelManager.setChannleInfoForCache(res)
      resolve(res)
    })
  })
}

export const getImageURL = (path, opts) => {
  if (path && path.length > 4) {
    const prefix = path.substring(0, 4)
    if (prefix === 'http') {
      return path
    }
  }
  const baseURl = import.meta.env.VITE_API_URL
  return `${baseURl}${path}`
}

export const getChannelAvatarTag = (channel) => {
  let myAvatarTag = 'channelAvatarTag'
  if (channel) {
    myAvatarTag = `channelAvatarTag:${channel.channelType}${channel.channelID}`
  }
  const tag = Cache.get(myAvatarTag)
  if (!tag) {
    return ''
  }
  return tag
}

export const avatarChannel = (channel) => {
  if (!channel) {
    return ''
  }
  // let avatarTag = getChannelAvatarTag(channel)
  let avatarTag = ''
  const channelInfo = getChannelInfo(channel)
  if (channelInfo && channelInfo.logo && channelInfo.logo !== '') {
    let logo = channelInfo.logo
    if (logo.indexOf('?') != -1) {
      logo += '&v=' + avatarTag
    } else {
      logo += '?v=' + avatarTag
    }
    return getImageURL(logo)
  }
  const baseURl = import.meta.env.VITE_API_URL
  if (channel.channelType === ChannelTypePerson) {
    return `${baseURl}users/${channel.channelID}/avatar?v=${avatarTag}`
  } else if (channel.channelType == ChannelTypeGroup) {
    return `${baseURl}groups/${channel.channelID}/avatar?v=${avatarTag}`
  }
  return ''
}

export const avatarUser = (uid, type = ChannelTypePerson) => {
  return avatarChannel(newChannel(uid, type))
}

// 请求缓存 Map，用于防止相同 channel 的重复请求
// key: channelKey (格式: channelType-channelID), value: Promise
const fetchChannelInfoPromiseCache = new Map()

// 获取频道信息，如果频道信息不存在，则从服务器获取
export const fetchChannelInfoIfNeed = (channel) => {
  return new Promise((resolve) => {
    const channelInfo = getChannelInfo(channel)
    if (channelInfo) {
      resolve(channelInfo)
    } else {
      fetchChannelInfoSync(channel).then((res) => {
        WKSDK.shared().channelManager.setChannleInfoForCache(res)
        resolve(res)
      })
    }
  })
}

// 从服务器获取频道信息（带请求去重逻辑）
export const fetchChannelInfoSync = (channel) => {
  // 生成唯一的 channel key
  const channelKey = `${channel.channelType}-${channel.channelID}`

  // 如果已经有相同 channel 的请求正在进行中，直接返回缓存的 Promise
  if (fetchChannelInfoPromiseCache.has(channelKey)) {
    return fetchChannelInfoPromiseCache.get(channelKey)
  }

  // 创建新的请求 Promise
  const requestPromise = new Promise((resolve, reject) => {
    chatApi
      .getChannelInfo(channel)
      .then((data) => {
        let channelInfo = new ChannelInfo()
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
        channelInfo.avatar = avatarChannel(channel)

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
        resolve(channelInfo)
      })
      .catch((err) => {
        reject(err)
      })
      .finally(() => {
        // 请求完成（无论成功或失败）后，从缓存中移除
        fetchChannelInfoPromiseCache.delete(channelKey)
      })
  })

  // 将新创建的 Promise 存入缓存
  fetchChannelInfoPromiseCache.set(channelKey, requestPromise)

  return requestPromise
}
