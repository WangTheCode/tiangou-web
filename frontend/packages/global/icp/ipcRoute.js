 
import { ipc } from './ipcRenderer'

export const URLS = {
    test: 'controller/example/test'
}

const apis = {}
for (const key in URLS) {
  const url = URLS[key]
  apis[key] = (data) => {
    return ipc.invoke(url,data)
  }
}
export default apis
