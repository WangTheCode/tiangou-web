import { WKSDK } from 'wukongimjssdk'
import { MergeforwardContent, FileContent } from './model'
import { MessageContentTypeConst } from './const'

export const init = () => {
  // 注册合并转发消息内容
  WKSDK.shared().register(MessageContentTypeConst.mergeForward, () => new MergeforwardContent())
  // 注册文件消息内容
  WKSDK.shared().register(MessageContentTypeConst.file, () => new FileContent())
}
