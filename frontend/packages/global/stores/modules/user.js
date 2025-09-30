import { defineStore } from 'pinia'
import piniaStore from '../counter'
import Cache from '../../utils/cache'
import { useTSDD } from '../../hooks/useTSDD'
import authApi from '../../api/auth'
import ipcApiRoute from '../../icp/ipcRoute'
export const useUserStore = defineStore('user', {
  state: () => ({
    token: '',
    userInfo: {},
    loginLoading: false,
    imConfig: {},
  }),
  getters: {},
  actions: {
    login(params) {
      if (this.loginLoading) {
        return
      }
      this.loginLoading = true
      return new Promise((resolve, reject) => {
        const { getDeviceInfo } = useTSDD()
        authApi
          .login({
            ...params,
            flag: 1,
            device: getDeviceInfo(),
          })
          .then(res => {
            this.userInfo = res
            this.token = res.token
            Cache.set('USER_INFO', this.userInfo)
            Cache.set('USER_TOKEN', this.token)
            this.loginLoading = false
            this.fetchImConfig()
              .then(() => {
                resolve(res)
              })
              .catch(err => {
                reject(err)
              })
          })
          .catch(err => {
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
      return new Promise((resolve, reject) => {
        this.userInfo = info
        Cache.set('USER_INFO', info)
        if (info.token) {
          this.token = info.token
          Cache.set('USER_TOKEN', info.token)
        }
        this.fetchImConfig()
          .then(() => {
            resolve(info)
          })
          .catch(err => {
            reject(err)
          })
      })
    },
    asyncUserInfo(info) {
      this.userInfo = info
    },
    fetchImConfig() {
      return new Promise((resolve, reject) => {
        authApi
          .imConfig(this.userInfo.uid)
          .then(res => {
            this.imConfig = res
            ipcApiRoute.setImConfig({ ...res, api_addr: import.meta.env.VITE_API_ADDR })
            resolve(res)
          })
          .catch(err => {
            reject(err)
          })
      })
    },
  },
})

export function useUserOutsideStore() {
  return useUserStore(piniaStore)
}
