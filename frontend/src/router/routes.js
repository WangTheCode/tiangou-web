import BasicLayout from '../layout/index.vue'

export const syncRoutes = [
  {
    path: '/',
    name: 'index',
    component: BasicLayout,
    meta: {},
    redirect: '/home',
    children: [
      {
        path: '/home',
        name: 'home',
        component: () => import(/* webpackChunkName: "home" */ '../views/home/Index.vue'),
      },
      {
        path: '/demo',
        name: 'demo',
        component: () => import(/* webpackChunkName: "demo" */ '../views/demo/Index.vue'),
      },
    ],
  },
]

export const constantRoutes = [
  {
    path: '/login',
    name: 'login',
    component: () => import(/* webpackChunkName: "login" */ '../views/auth/Login.vue'),
  },
]
