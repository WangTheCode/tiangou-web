import { ipc, isEE } from './ipcRenderer'

const huliInvoke = (url, params = null) => {
  return new Promise((resolve, reject) => {
    try {
      if (!isEE) {
        reject()
        return
      }

      // 修改：对于包含二进制数据的请求，直接传递不序列化
      let processedParams = params
      if (params && typeof params === 'object') {
        // 检查是否包含 fileBuffer（图片上传场景）
        const hasBuffer = params.content && params.content.fileBuffer
        if (!hasBuffer) {
          // 普通 JSON 数据，进行序列化
          processedParams = JSON.stringify(params)
        }
        // 如果有 fileBuffer，保持原样传递（Electron IPC 可直接传输 ArrayBuffer）
      }

      ipc
        .invoke(url, processedParams)
        .then((res) => {
          resolve(res)
        })
        .catch((err) => {
          reject(err)
        })
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
  syncChannelMessageList: 'controller/chatManage/syncChannelMessageList',
  setOpenConversation: 'controller/chatManage/setOpenConversation',
  clearChannelMessages: 'controller/chatManage/clearChannelMessages',
}

const apis = {}
for (const key in URLS) {
  const url = URLS[key]
  apis[key] = (data) => {
    return huliInvoke(url, data)
  }
}
export default apis
