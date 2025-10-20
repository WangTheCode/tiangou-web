import { post } from '../utils/http/axios'
export const URLS = {
  getConfig: '/api/game/config/getValue',
}

const apis = {}
for (const key in URLS) {
  const url = URLS[key]
  apis[key] = (data, option = {}) => {
    return post({ url, data, ...option })
  }
}
export default apis
