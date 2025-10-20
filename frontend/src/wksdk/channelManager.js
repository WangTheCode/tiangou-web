import { WKSDK, Channel, ChannelTypePerson, ConnectStatus, ChannelTypeGroup } from 'wukongimjssdk'
import { useChatStore } from '@/stores/index'
import Cache from '@/utils/cache'

export const newChannel = (channelID, channelType = ChannelTypePerson) => {
  return new Channel(channelID, channelType)
}

export const getChannelInfo = (channel) => {
  console.log('channel', channel)
  if (!channel.getChannelKey) {
    channel = newChannel(channel.channelID, channel.channelType)
  }
  return WKSDK.shared().channelManager.getChannelInfo(channel)
}

export const fetchChannelInfo = (channel) => {
  WKSDK.shared().channelManager.fetchChannelInfo(channel)
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
  let avatarTag = getChannelAvatarTag(channel)
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

export const fetchChannelInfoIfNeed = (channel) => {
  const channelInfo = getChannelInfo(channel)
  if (!channelInfo) {
    fetchChannelInfo(channel)
  }
}
