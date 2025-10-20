export { default as commonApi } from './common.js'

export const getUrl = (url, data) => {
  if (url.indexOf('{') !== -1) {
    for (const key in data) {
      url = url.replace(`{${key}}`, data[key])
    }
  }
  return url
}
