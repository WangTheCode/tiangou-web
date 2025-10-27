import { ipc, isEE } from './ipcRenderer'

const huliInvoke = (url, params = null) => {
  return new Promise((resolve, reject) => {
    try {
      if (params && typeof params === 'object') {
        params = JSON.stringify(params)
      }
      if (!isEE) {
        reject()
        return
      }
      ipc
        .invoke(url, params)
        .then((res) => {
          resolve(res)
        })
        .catch((err) => {
          reject(err)
        })
      // if (res && res.code != 0) {
      //   let msg = res.message

      //   reject(new Error(msg))
      // } else {
      //   resolve(res)
      // }
    } catch (error) {
      reject(error)
    }
  })
}

export const URLS = {
  test: 'controller/example/test',
  getMessagePageList: 'controller/chatMessage/getMessagePageList',
  addMessage: 'controller/chatMessage/addMessage',
  connectTcp: 'controller/chatManage/connectTcp',
  syncConversationList: 'controller/chatManage/syncConversationList',
  setImConfig: 'controller/chatManage/setImConfig',
  sendMessage: 'controller/chatManage/sendMessage',
}

const apis = {}
for (const key in URLS) {
  const url = URLS[key]
  apis[key] = (data) => {
    return huliInvoke(url, data)
  }
}
export default apis
