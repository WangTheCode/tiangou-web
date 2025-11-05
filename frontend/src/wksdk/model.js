import { useUserStore } from '../stores'
import {
  WKSDK,
  Channel,
  ChannelTypePerson,
  MessageStatus,
  MessageContent,
  Message,
  MediaMessageContent,
} from 'wukongimjssdk'
import { getUUID } from '../utils/helper'
import { BubblePosition, MessageReasonCode, OrderFactor, MessageContentTypeConst } from './const'

export class Part {
  type // 文本内容： text:普通文本 emoji: emoji文本 mention：@文本
  text
  data

  constructor(type, text, data) {
    this.type = type
    this.text = text
    this.data = data
  }
}

/* eslint-disable no-undef */
export class MessageWrap {
  constructor(message) {
    this.message = message
    this.checked = false // 是否选中
    this.locateRemind = undefined // 定位到消息后是否需要提醒
    this._parts = undefined
    this.preMessage = undefined
    this.nextMessage = undefined
    this.voiceBuff = undefined // 声音的二进制文件，用于缓存
    this._reasonCode = undefined // 消息错误原因代码
    this.order = message.messageSeq * OrderFactor // 消息排序号
    // this.clientMsgNo = message.clientMsgNo
  }

  get header() {
    return this.message.header
  }

  get setting() {
    return this.message.setting
  }

  get clientSeq() {
    return this.message.clientSeq
  }

  get messageID() {
    return this.message.messageID || getUUID()
  }

  get messageSeq() {
    return this.message.messageSeq
  }

  get clientMsgNo() {
    return this.message.clientMsgNo
  }

  set clientMsgNo(clientMsgNo) {
    this.message.clientMsgNo = clientMsgNo
  }

  get fromUID() {
    return this.message.fromUID
  }

  get from() {
    return WKSDK.shared().channelManager.getChannelInfo(
      new Channel(this.fromUID, ChannelTypePerson),
    )
  }

  get channel() {
    return this.message.channel
  }

  get timestamp() {
    return this.message.timestamp
  }

  get content() {
    return this.message.content
  }

  get status() {
    return this.message.status
  }

  set status(status) {
    this.message.status = status
  }

  get reasonCode() {
    if (this.status == MessageStatus.Normal) {
      return MessageReasonCode.reasonSuccess
    }
    return this._reasonCode || MessageReasonCode.reasonUnknown
  }

  set reasonCode(v) {
    this._reasonCode = v
  }

  get voicePlaying() {
    return this.message.voicePlaying
  }

  get voiceReaded() {
    return this.message.voiceReaded
  }

  get reactions() {
    return this.message.reactions
  }

  get unreadCount() {
    return this.message.remoteExtra.unreadCount
  }

  get readedCount() {
    return this.message.remoteExtra.readedCount
  }

  set readedCount(v) {
    this.message.remoteExtra.readedCount = v
  }

  get isDeleted() {
    return this.message.isDeleted
  }

  set isDeleted(isDeleted) {
    this.message.isDeleted = isDeleted
  }

  get revoke() {
    return this.message.remoteExtra.revoke
  }

  set revoke(revoke) {
    this.message.remoteExtra.revoke = revoke
  }

  get revoker() {
    return this.message.remoteExtra.revoker
  }

  set revoker(revoker) {
    this.message.remoteExtra.revoker = revoker
  }

  // 是否是发送的消息
  get send() {
    const userStore = useUserStore()
    const userInfo = userStore.userInfo
    if (userInfo && userInfo.uid) {
      return this.message.fromUID === userInfo.uid
    }
    return false
  }

  get contentType() {
    return this.message.contentType
  }

  resetParts() {
    this._parts = undefined
    this._parts = this.parts
  }

  get parts() {
    if (!this._parts) {
      this._parts = this.parseMention()
      this._parts = this.parseEmoji(this._parts)
      this._parts = this.parseLinks(this._parts)
    }
    return this._parts
  }

  get bubblePosition() {
    if (!this.preIsSamePerson && this.nextIsSamePerson) {
      return BubblePosition.first
    }
    if (this.preIsSamePerson && this.nextIsSamePerson) {
      return BubblePosition.middle
    }

    if (this.preIsSamePerson && !this.nextIsSamePerson) {
      return BubblePosition.last
    }
    if (!this.preIsSamePerson && !this.nextIsSamePerson) {
      return BubblePosition.single
    }
    return BubblePosition.unknown
  }

  get preIsSamePerson() {
    if (this.preMessage?.content.contentType === MessageContentTypeConst.time) {
      return false
    }
    if (this.preMessage?.revoke) {
      return false
    }
    return this.preMessage?.fromUID === this.fromUID
  }

  get nextIsSamePerson() {
    if (this.nextMessage?.content.contentType === MessageContentTypeConst.time) {
      return false
    }
    if (this.nextMessage?.revoke) {
      return false
    }
    return this.nextMessage?.fromUID === this.fromUID
  }

  // 解析@
  parseMention() {
    if (this.content.contentType !== MessageContentType.text) {
      return []
    }
    let textContent = this.content
    if (this.message.remoteExtra.isEdit && this.message.remoteExtra.contentEdit !== undefined) {
      textContent = this.message.remoteExtra.contentEdit
    }
    let text = textContent.text || ''
    const mention = this.content.mention
    if (!mention?.uids || mention.uids.length <= 0) {
      return [new Part(PartType.text, text)]
    }
    let parts = []
    let i = 0
    while (text.length > 0) {
      const mentionMatchResult = text.match(/@([\w\u4e00-\u9fa5])+/m)
      let index = mentionMatchResult?.index
      if (index === undefined) {
        index = -1
      }
      if (!mentionMatchResult || index === -1) {
        parts.push(new Part(PartType.text, text))
        break
      }
      if (index > 0) {
        parts.push(new Part(PartType.text, text.substring(0, index)))
      }
      let data = {}
      if (i < mention.uids.length) {
        data = { uid: mention.uids[i] }
      }

      parts.push(new Part(PartType.mention, text.substr(index, mentionMatchResult[0].length), data))
      text = text.substring(index + mentionMatchResult[0].length)

      i++
    }
    return parts
  }

  // 解析emoji
  parseEmoji(parts) {
    if (!parts || parts.length <= 0) {
      return parts
    }
    let len = parts.length
    let newParts = []
    for (let index = 0; index < len; index++) {
      const part = parts[index]
      if (part.type === PartType.text) {
        let text = part.text
        while (text.length > 0) {
          const matchResult = text.match(DefaultEmojiService.shared.emojiRegExp())
          if (!matchResult) {
            newParts.push(new Part(PartType.text, text))
            break
          }
          let index = matchResult?.index
          if (index === undefined) {
            index = -1
          }
          if (index === -1) {
            newParts.push(new Part(PartType.text, text))
            break
          }
          if (index > 0) {
            newParts.push(new Part(PartType.text, text.substring(0, index)))
          }
          newParts.push(new Part(PartType.emoji, text.substr(index, matchResult[0].length)))
          text = text.substring(index + matchResult[0].length)
        }
      } else {
        newParts.push(part)
      }
    }
    return newParts
  }

  parseLinks(parts) {
    if (!parts || parts.length <= 0) {
      return parts
    }
    let newParts = []
    let len = parts.length
    for (let index = 0; index < len; index++) {
      const part = parts[index]
      if (part.type === PartType.text) {
        let text = part.text
        while (text.length > 0) {
          const matchResult = text.match(
            /((http|ftp|https):\/\/|www.)[\w\-_]+(\.[\w\-_]+)+([\w\-.,@?^=%&amp;:/~+#]*[\w\-@?^=%&amp;/~+#])?/,
          )
          if (!matchResult) {
            newParts.push(new Part(PartType.text, text))
            break
          }
          let index = matchResult?.index
          if (index === undefined) {
            index = -1
          }
          if (index === -1) {
            newParts.push(new Part(PartType.text, text))
            break
          }
          if (index > 0) {
            newParts.push(new Part(PartType.text, text.substring(0, index)))
          }
          newParts.push(new Part(PartType.link, text.substr(index, matchResult[0].length)))
          text = text.substring(index + matchResult[0].length)
        }
      } else {
        newParts.push(part)
      }
    }
    return newParts
  }

  get flame() {
    if (this.message.content.contentObj) {
      return this.message.content.contentObj.flame === 1
    }
    return false
  }

  get remoteExtra() {
    return this.message.remoteExtra
  }
}

export class MergeforwardContent extends MessageContent {
  constructor(channelType, users, msgs) {
    super()
    this.channelType = channelType
    this.users = users
    this.msgs = msgs
  }

  decodeJSON(content) {
    this.channelType = content['channel_type'] || 0
    this.users = content['users'] || []
    let msgMaps = content['msgs']

    let messages = new Array()
    if (msgMaps && msgMaps.length > 0) {
      for (const msgMap of msgMaps) {
        messages.push(this.mapToMessage(msgMap))
      }
    }
    this.msgs = messages
  }

  encodeJSON() {
    let messageMaps = new Array()
    if (this.msgs && this.msgs.length > 0) {
      for (const msg of this.msgs) {
        messageMaps.push(this.messageToMap(msg))
      }
    }
    return { channel_type: this.channelType || 0, users: this.users, msgs: messageMaps }
  }

  get contentType() {
    return MessageContentTypeConst.mergeForward
  }

  get conversationDigest() {
    return '[合并转发]'
  }

  mapToMessage(messageMap) {
    let message = new Message()
    message.messageID = `${messageMap['message_id']}`
    message.timestamp = messageMap['timestamp']
    message.fromUID = messageMap['from_uid']

    let payloadObj = messageMap['payload']
    if (!payloadObj) {
      payloadObj = {}
    }
    let contentType = 0
    if (payloadObj) {
      contentType = payloadObj.type
    }
    let messageContent = WKSDK.shared().getMessageContent(contentType)
    messageContent.decodeJSON(payloadObj)
    message.content = messageContent
    return message
  }

  messageToMap(message) {
    return {
      message_id: message.messageID,
      from_uid: message.fromUID ?? '',
      timestamp: message.timestamp,
      payload: message.content.contentObj,
    }
  }
}

export class ImageContent extends MediaMessageContent {
  constructor(file, imgData, width, height) {
    super()
    this.file = file // File 对象（仅 Web 环境使用）
    // this.remoteUrl = this.url
    this.imgData = imgData // base64 预览数据
    this.width = width || 0
    this.height = height || 0
    this.uploadKey = getUUID()
  }

  decodeJSON(content) {
    this.width = content['width'] || 0
    this.height = content['height'] || 0
    this.url = content['url'] || ''
    this.remoteUrl = this.url
  }

  encodeJSON() {
    return { width: this.width || 0, height: this.height || 0, url: this.remoteUrl || '' }
  }

  get contentType() {
    return MessageContentTypeConst.image
  }

  get conversationDigest() {
    return '[图片]'
  }
}
