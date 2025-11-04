const axios = require('axios')
const { logger } = require('ee-core/log')

// 创建 axios 实例（单例模式）
const axiosInstance = axios.create({
  timeout: 60000, // 上传超时 60s
})

// 请求拦截器：添加日志
axiosInstance.interceptors.request.use(
  config => {
    logger.info('Axios 请求:', {
      method: config.method,
      url: config.url,
      headers: config.headers,
    })
    return config
  },
  error => {
    logger.error('Axios 请求错误:', error)
    return Promise.reject(error)
  }
)

// 响应拦截器：统一错误处理
axiosInstance.interceptors.response.use(
  response => {
    logger.info('Axios 响应:', {
      status: response.status,
      url: response.config.url,
    })
    return response
  },
  error => {
    logger.error('Axios 响应错误:', {
      url: error.config?.url,
      status: error.response?.status,
      message: error.message,
    })
    return Promise.reject(error)
  }
)

/**
 * 设置 axios 全局配置
 * @param {Object} options
 * @param {string} options.baseUrl - 基础URL
 * @param {Object} options.headers - 请求头（如 token）
 */
function setAxiosConfig(options = {}) {
  if (options.baseUrl) {
    axiosInstance.defaults.baseURL = options.baseUrl
    logger.info('Axios baseURL 已更新:', options.baseUrl)
  }

  if (options.headers && typeof options.headers === 'object') {
    // 合并 headers，保留现有配置
    axiosInstance.defaults.headers.common = {
      ...axiosInstance.defaults.headers.common,
      ...options.headers,
    }
    logger.info('Axios headers 已更新:', options.headers)
  }
}

/**
 * 获取当前配置
 */
function getAxiosConfig() {
  return {
    baseURL: axiosInstance.defaults.baseURL,
    headers: { ...axiosInstance.defaults.headers.common },
  }
}

module.exports = {
  axiosInstance,
  setAxiosConfig,
  getAxiosConfig,
}
