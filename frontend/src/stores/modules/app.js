import { defineStore } from 'pinia'
import piniaStore from '@/stores'
import Cache from '@/utils/cache'
import { ThemeEnum } from '@/enums/appEnum'
import { parseRouteKey } from '@/utils/helper'

export const useAppStore = defineStore('app', {
  state: () => ({
    theme: ThemeEnum.LIGHT,
    device: 'desktop',
    isOpenSide: false,
    sideWidth: 200,
    multiTabs: [],
    keepAliveKeys: [],
    keepPages: [],
    locale: 'zh',
    isLangFileLoadSuccess: false,
    isRegisterRouter: false,
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
    toggleOpenSide(flag) {
      this.isOpenSide = flag
    },
    setSideWidth(width) {
      this.sideWidth = width
    },
    setMultiTabs(data) {
      this.multiTabs = data
      this.keepAliveKeys = data.map((p) => parseRouteKey(p))
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
  },
})

export function useAppOutsideStore() {
  return useAppStore(piniaStore)
}
