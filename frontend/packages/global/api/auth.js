import { post } from '../utils/http/axios'
export const URL = {
  login: '/user/login',
  logout: '/api/member/memberAuth/logout',
}

export default class authApi {
  static login = async (data) => post({ url: URL.login, data })
  static logout = async () => post({ url: URL.logout })
}
