import {
  Channel,
  ChannelInfo,
  ChannelTypePerson,
  Conversation,
  WKSDK,
  Message,
  MessageContentType,
  MessageStatus,
  MessageText,
} from 'wukongimjssdk'
import { getImageURL, getChannelAvatarTag } from './index'

export class ConversationWrap {
  constructor(conversation) {
    this.conversation = conversation
    this.avatarHashTag = ''
  }
  // channel: Channel;
  // private _channelInfo;
  // unread: number;
  // timestamp: number;
  // lastMessage: Message;
  // isMentionMe: boolean;
  // constructor();
  // get channelInfo(): ChannelInfo;
  // isEqual(c: Conversation): boolean;

  get avatar() {
    if (this.channelInfo && this.channelInfo.logo && this.channelInfo.logo !== '') {
      return `${getImageURL(this.channelInfo.logo)}?v=${getChannelAvatarTag(this.channel)}`
    }
    return WKApp.shared.avatarChannel(this.channel)
  }

  get channel() {
    return this.conversation.channel
  }

  get channelInfo() {
    return this.conversation.channelInfo
  }

  get unread() {
    return this.conversation.unread
  }

  get timestamp() {
    return this.conversation.timestamp
  }

  set timestamp(timestamp) {
    this.conversation.timestamp = timestamp
  }

  get lastMessage() {
    return this.conversation.lastMessage
  }

  set lastMessage(lastMessage) {
    this.conversation.lastMessage = lastMessage
  }

  get isMentionMe() {
    return this.conversation.isMentionMe
  }

  get remoteExtra() {
    return this.conversation.remoteExtra
  }

  set isMentionMe(isMentionMe) {
    this.conversation.isMentionMe = isMentionMe
  }

  get reminders() {
    return this.conversation.reminders
  }

  get simpleReminders() {
    return this.conversation.simpleReminders
  }

  reloadIsMentionMe() {
    return this.conversation.reloadIsMentionMe()
  }

  get extra() {
    if (!this.conversation.extra) {
      this.conversation.extra = {}
    }
    return this.conversation.extra
  }

  get category() {
    if (!this.conversation.channelInfo || !this.conversation.channelInfo.orgData) {
      return ''
    }
    const channelInfo = this.conversation.channelInfo
    if (channelInfo.orgData.category !== '' && channelInfo.orgData.category === 'solved') {
      return channelInfo.orgData.category
    }
    if (channelInfo.orgData.category === '' && channelInfo.orgData.agent_uid === '') {
      return 'new'
    }
    if (channelInfo.orgData.agent_uid === WKApp.loginInfo.uid) {
      return 'assignMe'
    }
    if (channelInfo.orgData.agent_uid !== '') {
      return 'allAssigned'
    }
    return channelInfo.orgData.category
  }

  isEqual(c) {
    return this.conversation.isEqual(c.conversation)
  }
}
