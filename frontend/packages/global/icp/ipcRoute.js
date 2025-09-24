 
import { ipc } from './ipcRenderer'

export const URLS = {
    test: 'controller/example/test',
    getMessagePageList: 'controller/chatMessage/getMessagePageList',
    addMessage: 'controller/chatMessage/addMessage'
}

const apis = {}
for (const key in URLS) {
  const url = URLS[key]
  apis[key] = (data) => {
    return ipc.invoke(url,data)
  }
}
export default apis
