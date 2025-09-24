import { defineStore } from 'pinia'
import piniaStore from '../counter'
import Cache from '../../utils/cache'
import { ThemeEnum } from '../../enums/appEnum'
// import { parseRouteKey } from '@/utils/helper'
import Fingerprint2 from 'fingerprintjs2'
export const useAppStore = defineStore('app', {
  state: () => ({
    theme: ThemeEnum.LIGHT,
    device: 'desktop',
    locale: 'zh',
    isLangFileLoadSuccess: false,
    isRegisterRouter: false,
    playAudioUrl: '',
    fingerprint: '',
  }),
  getters: {},
  actions: {
    initTheme() {
      const cacheTheme = Cache.get('APP_THEME')
      if (cacheTheme) {
        this.setTheme(cacheTheme)
      } else {
        document.documentElement.className = `theme-${this.theme}`
      }
    },
    // Change theme
    setTheme(theme) {
      this.theme = theme
      Cache.set('APP_THEME', this.theme)
      document.documentElement.className = `theme-${this.theme}`
    },
    setLocale(locale) {
      this.locale = locale
    },
    setLangFileLoadSuccess() {
      this.isLangFileLoadSuccess = true
    },

    setDevice(device) {
      this.device = device
    },

    setKeepPages(pages) {
      this.keepPages = pages
    },
    addKeepPages(page) {
      this.keepPages.push(page)
    },
    setRegisterRouterStatus(status) {
      this.isRegisterRouter = status
    },
    setPlayAudioUrl(url) {
      this.playAudioUrl = url
    },
    createFingerprint() {
      const that = this
      Fingerprint2.get((components) => {
        // 参数只有回调函数时，默认浏览器指纹依据所有配置信息进行生成
        const values = components.map((component) => component.value) // 配置的值的数组
        const murmur = Fingerprint2.x64hash128(values.join(''), 31) // 生成浏览器指纹
        that.fingerprint = murmur
      })
    },
  },
})

export function useAppOutsideStore() {
  return useAppStore(piniaStore)
}
