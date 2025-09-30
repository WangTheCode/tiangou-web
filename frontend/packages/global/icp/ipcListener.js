/**
 * 用于监听http请求electron服务的消息
 */

import { ipc } from './ipcRenderer'
import { useChatStore } from '../stores/index'
import { ConnectStatus } from 'wukongimjssdk'
// const userStore = useUserStore()
export const URLS = {
  onConnectStatus: 'controller.web.onConnectStatus',
}

export default class ipcListener {
  static onConnectStatus = () => {
    const chatStore = useChatStore()
    ipc.removeAllListeners(URLS.onConnectStatus)
    ipc.on(URLS.onConnectStatus, (_e, result) => {
      const { status, reasonCode } = result
      if (status === ConnectStatus.Connecting) {
        chatStore.setConnectStatus('loading')
      } else if (status === ConnectStatus.Connected) {
        chatStore.setConnectStatus('success')
      } else {
        chatStore.setConnectStatus('error')
      }
    })
  }
}
