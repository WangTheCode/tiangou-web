import { getChannelInfo, newChannel } from '@/wksdk/channelManager'
import chatApi from '@/api/chat'
import { ElMessage } from 'element-plus'
import { MessageContentType } from 'wukongimjssdk'

/**
 * 收藏聊天消息
 * @param {*} message
 */
export const addFaveMessage = (message) => {
  let content = ''
  if (message.contentType === MessageContentType.text) {
    content = message.content.contentObj.content
  } else if (message.contentType === MessageContentType.image) {
    content = message.content.contentObj.url
  }
  const fromChannelInfo = getChannelInfo(newChannel(message.fromUID))
  const params = {
    type: message.contentType,
    unique_key: message.messageID,
    author_name: fromChannelInfo?.title || '',
    author_uid: message.fromUID,
    payload: { content: content },
  }
  chatApi.addFaveMessage(params).then(() => {
    ElMessage({
      message: '收藏成功',
      type: 'success',
    })
  })
}
