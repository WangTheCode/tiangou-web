import { defineStore } from 'pinia'
import piniaStore from '../counter'
import Cache from '../../utils/cache'

import authApi from '../../api/auth'
export const useUserStore = defineStore('user', {
  state: () => ({
    token: '',
    userInfo: {},
    loginLoading: false,
  }),
  getters: {},
  actions: {
    login(token) {
      if (this.loginLoading) {
        return
      }
      this.loginLoading = true
      return new Promise((resolve, reject) => {
        // const params = getUrlParams(window.location.search)
        // const token = params.token
        if (!token) {
          // router.push('/401')
          reject(new Error('token is required'))
          return
        }
        authApi
          .login({ token })
          .then((res) => {
            this.userInfo = res.data
            this.token = token
            Cache.set('USER_INFO', this.userInfo)
            Cache.set('USER_TOKEN', token)
            this.loginLoading = false
            resolve(res)
          })
          .catch((err) => {
            this.loginLoading = false
            // router.push('/401')
            reject(err)
          })
      })
    },
    logout() {
      return new Promise((resolve, reject) => {
        resolve(true)
        // router.push('/home')
        // userApi
        //   .Logout()
        //   .then((res) => {
        //     this.setToken({})
        //     this.userInfo = undefined
        //     this.noticeCount = 0
        //     resolve(res)
        //     router.push('/home')
        //   })
        //   .catch((err) => reject(err))
      })
    },
    setUserInfo(info) {
      this.userInfo = info
      Cache.set('USER_INFO', info)
    },
    asyncUserInfo(info) {
      this.userInfo = info
    },
  },
})

export function useUserOutsideStore() {
  return useUserStore(piniaStore)
}
