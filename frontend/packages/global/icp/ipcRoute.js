import { ipc } from './ipcRenderer'

const huliInvoke = (url, params = null) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (params && typeof params === 'object') {
        params = JSON.stringify(params)
      }
      const res = await ipc.invoke(url, params)
      console.log(res)
      // if (res && res.code != 0) {
      //   let msg = res.message

      //   reject(new Error(msg))
      // } else {
      //   resolve(res)
      // }
      resolve(res)
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
}

const apis = {}
for (const key in URLS) {
  const url = URLS[key]
  apis[key] = data => {
    return huliInvoke(url, data)
  }
}
export default apis
