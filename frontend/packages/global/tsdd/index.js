import Cache from '../utils/cache'
import WKSDK,{ ChannelTypePerson, ChannelTypeGroup } from 'wukongimjssdk'
/**
    *  获取图片完整地址
    * @param path  图片路径
    * @param opts 参数
    */
export function getImageURL(path, opts) {
    if (path && path.length > 4) {
        const prefix = path.substring(0, 4)
        if (prefix === 'http') {
            return path
        }
    }
    const baseURl = import.meta.env.VITE_HTTP_URL
    return `${baseURl}${path}`
}


export function getChannelAvatarTag(channel) {
    let myAvatarTag = "channelAvatarTag";
    if (channel) {
      myAvatarTag = `channelAvatarTag:${channel.channelType}${channel.channelID}`;
    }
    const tag = Cache.get(myAvatarTag);
    if (!tag) {
      return "";
    }
    return tag;
  }

  export function avatarChannel(channel) {
    if (!channel) {
      return "";
    }
    let avatarTag = getChannelAvatarTag(channel);
    const channelInfo = WKSDK.shared().channelManager.getChannelInfo(channel);
    if (channelInfo && channelInfo.logo && channelInfo.logo !== "") {
      let logo = channelInfo.logo;
      if (logo.indexOf("?") != -1) {
        logo += "&v=" + avatarTag;
      } else {
        logo += "?v=" + avatarTag;
      }
      return getImageURL(logo);
    }
    const baseURl = import.meta.env.VITE_HTTP_URL;
    if (channel.channelType === ChannelTypePerson) {
      return `${baseURl}users/${channel.channelID}/avatar?v=${avatarTag}`;
    } else if (channel.channelType == ChannelTypeGroup) {
      return `${baseURl}groups/${channel.channelID}/avatar?v=${avatarTag}`;
    }
    return "";
  }