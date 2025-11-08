import { post, get } from '../utils/http/axios'
export const URLS = {
  getCountries: '/common/countries',
  getCaptchaImage: '/common/captcha/generate',
  sendSmsCode: '/user/sms/login_code',
}

// const apis = {}
// for (const key in URLS) {
//   const url = URLS[key]
//   apis[key] = (data, option = {}) => {
//     return post({ url, data, ...option })
//   }
// }
// export default apis
export default class commonApi {
  static getCountries = async () => get({ url: URLS.getCountries })
  static getCaptchaImage = async () => get({ url: URLS.getCaptchaImage })
  static sendSmsCode = async (data) => post({ url: URLS.sendSmsCode, data })
}
