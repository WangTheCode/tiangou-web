import { createModalManager } from '@/utils/helper/modalManager'
import PopupTextarea from './PopupTextarea.vue'
import PopupAvatar from './PopupAvatar.vue'
import PopupQrcode from './PopupQrcode.vue'
import PopupGroupManage from './PopupGroupManage.vue'
import PopupChannelSelect from './PopupChannelSelect.vue'
import PopupBlackList from './PopupBlackList.vue'
// 使用通用的 modalManager 创建各个弹窗方法
export const showPopupTextarea = (props) => {
  return createModalManager(PopupTextarea, props)
}

export const showPopupAvatar = (props) => {
  return createModalManager(PopupAvatar, props)
}

export const showPopupQrcode = (props) => {
  return createModalManager(PopupQrcode, props)
}

export const showPopupGroupManage = (props) => {
  return createModalManager(PopupGroupManage, props)
}

export const showPopupChannelSelect = (props) => {
  return createModalManager(PopupChannelSelect, props)
}

export const showPopupBlackList = (props) => {
  return createModalManager(PopupBlackList, props)
}
