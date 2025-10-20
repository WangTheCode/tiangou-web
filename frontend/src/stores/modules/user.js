import { defineStore } from 'pinia'
import piniaStore from '@/stores'
import Cache from '@/utils/cache'
import router from '@/router'
import { newChannel } from '@/wksdk/channelManager'
import authApi from '@/api/auth'
import ipcApiRoute from '@/utils/icp/ipcRoute'
import { isEE } from '@/utils/icp/ipcRenderer'
import { getDeviceInfo } from '@/wksdk/utils'

export const useUserStore = defineStore('user', {
  state: () => ({
    userInfo: undefined,
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
        authApi
          .login({
            ...params,
            flag: 1,
            device: getDeviceInfo(),
          })
          .then((res) => {
            this.loginLoading = false
            this.setUserInfo(res).then(() => {
              resolve(res)
            })
            // this.userInfo = res
            // this.token = res.token
            // Cache.set('USER_INFO', this.userInfo)
            // Cache.set('USER_TOKEN', this.token)
            // this.fetchImConfig()
            //   .then(() => {
            //     resolve(res)
            //   })
            //   .catch(err => {
            //     reject(err)
            //   })
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
        router.push('/home')
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
        info.channel = newChannel(info.uid)
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
          .catch((err) => {
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
          .then((res) => {
            this.imConfig = res
            if (isEE) {
              ipcApiRoute.setImConfig({ ...res, api_addr: import.meta.env.VITE_API_ADDR })
            }
            resolve(res)
          })
          .catch((err) => {
            reject(err)
          })
      })
    },
  },
})

export function useUserOutsideStore() {
  return useUserStore(piniaStore)
}
