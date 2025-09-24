import { post } from '@global/utils/http/axios'

const baseUrl = import.meta.env.VITE_APP_API_URL

export const URLS = {
  startGame: '/api/game/mines/startGame',
  openCard: '/api/game/mines/openCard',
  cashOut: '/api/game/mines/cashOut',
  getHistoryRecords: '/api/game/mines/getHistoryRecords',
}

const apis = {}
for (const key in URLS) {
  const url = URLS[key]
  apis[key] = (data, option = {}) => {
    return post({ url, data, ...option,baseURL: baseUrl })
  }
}
export default apis
