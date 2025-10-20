import { createRouter, createWebHistory } from 'vue-router'
import { constantRoutes, syncRoutes } from './routes'
import NProgress from 'nprogress'
import 'nprogress/nprogress.css'
import { cloneDeep } from 'lodash-es'
import { treeToList } from '../utils/helper/treeHelper'
import { useAppStore, useUserStore } from '@/stores'
// import { useUserOutsideStore } from '@/stores/modules/user'
import Cache from '@/utils/cache'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: constantRoutes,
})

let isInit = true
// 注册异步路由
const registerRouters = (appStore) => {
  return new Promise((resolve) => {
    if (appStore.isRegisterRouter) {
      resolve(false)
      return
    }
    const cloneDeepSyncRoutes = cloneDeep(syncRoutes)
    // 如需根据权限控制路由，可在此处添加逻辑
    const renderAddRouters = treeToList(cloneDeepSyncRoutes[0].children, 'children')
    cloneDeepSyncRoutes[0].children = renderAddRouters
    cloneDeepSyncRoutes.forEach((route) => {
      router.addRoute(route)
    })
    appStore.setRegisterRouterStatus(true)
    setTimeout(() => {
      resolve(true)
    }, 10)
  })
}

router.beforeEach(async (to, _from, next) => {
  NProgress.start() // 进度条开始
  const appStore = useAppStore()
  if (isInit) {
    // 应用初始化执行的操作
    isInit = false
    appStore.initTheme()
  }

  if (!appStore.isRegisterRouter) {
    // 登录验证逻辑
    const userInfo = Cache.get('USER_INFO')
    if (userInfo && userInfo.uid && to.path !== '/login') {
      const userStore = useUserStore()
      userStore.asyncUserInfo(userInfo)
      // 注册异步路由
      const isRegisterRouter = await registerRouters(appStore)
      if (isRegisterRouter) {
        next({ ...to, replace: true })
        return
      }
      next()
      return
    } else if (to.path !== '/login') {
      next('/login')
      return
    }
  }
  next()
})

router.afterEach(() => {
  NProgress.done() // 进度条结束
})

export default router
