import { WKSDK } from 'wukongimjssdk'
import { MergeforwardContent, FileContent, VideoContent } from './model'
import { MessageContentTypeConst } from './const'

export const init = () => {
  // 注册合并转发消息内容
  WKSDK.shared().register(MessageContentTypeConst.mergeForward, () => new MergeforwardContent())
  // 注册文件消息内容
  WKSDK.shared().register(MessageContentTypeConst.file, () => new FileContent())
  // 注册小视频消息内容
  WKSDK.shared().register(MessageContentTypeConst.smallVideo, () => new VideoContent())
}
