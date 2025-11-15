import axios from 'axios'
// import { notification } from 'ant-design-vue'
import Cache from '@/utils/cache'
import { useUserStore } from '@/stores'
import router from '@/router'
import { ElNotification } from 'element-plus'

//请求超时时间
axios.defaults.timeout = 30000

let token = ''

//请求地址
let baseURL = '/v1/'
if (import.meta.env.VITE_API_URL && import.meta.env.MODE === 'production') {
  baseURL = import.meta.env.VITE_API_URL
}
const axiosInstance = axios.create({
  baseURL: baseURL,
})

// axios实例拦截请求
axiosInstance.interceptors.request.use(
  (config) => {
    // 请求头添加token
    if (!token) {
      const userToken = Cache.get('USER_TOKEN')
      if (userToken) {
        token = userToken
      }
    }
    config.headers['token'] = token
    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

// axios实例拦截响应
axiosInstance.interceptors.response.use(
  (response) => {
    return response
  },
  // 请求失败
  (error) => {
    if (error.status === 401) {
      //登录
      const userStore = useUserStore()
      userStore.setUserInfo(undefined)
      router.push('/login')
    } else {
      //提示错误
      const status = error.response ? error.response.status : '提示'
      let message = ''
      if (error.response && error.response.data && error.response.data.msg) {
        message = error.response.data.msg
      }
      console.log('err', error)
      if (message) {
        ElNotification({
          title: status,
          message: message,
          type: 'error',
        })
      }
    }
    return Promise.reject(error)
  },
)

const request = (config) => {
  const conf = config
  return new Promise((resolve, reject) => {
    axiosInstance
      .request(conf)
      .then((res) => {
        const { data } = res
        // // 请求响应体中code不为200时，则认为请求失败
        // if (data.code != 200) {
        //   const err = res
        //   err.response = {
        //     data: data,
        //   }
        //   reject(err)
        //   return
        // }
        resolve(data)
      })
      .catch((error) => {
        reject(error)
      })
  })
}

export function get(config) {
  return request({ ...config, method: 'GET' })
}

export function post(config) {
  return request({ ...config, method: 'POST' })
}
export function put(config) {
  return request({ ...config, method: 'PUT' })
}
export function del(config) {
  return request({ ...config, method: 'DELETE' })
}

export default request
