import { WKSDK } from 'wukongimjssdk'
import { MergeforwardContent } from './model'
import { MessageContentTypeConst } from './const'

export const init = () => {
  WKSDK.shared().register(MessageContentTypeConst.mergeForward, () => new MergeforwardContent()) // 合并转发
}
