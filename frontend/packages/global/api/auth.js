import { post } from '../utils/http/axios'
export const URL = {
  login: '/api/member/memberAuth/loginByToken',
  logout: '/api/member/memberAuth/logout',
}

export default class authApi {
  static login = async (data) => post({ url: URL.login, data })
  static logout = async () => post({ url: URL.logout })
}
