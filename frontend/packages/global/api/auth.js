import { post,get } from '../utils/http/axios'
export const URL = {
  login: '/user/login',
  logout: '/api/member/memberAuth/logout',
  imConfig: '/users/{uid}/im',
}

export default class authApi {
  static login = async (data) => post({ url: URL.login, data })
  static logout = async () => post({ url: URL.logout })
  static imConfig = async (uid) => get({ url: URL.imConfig.replace('{uid}', uid) })
}
