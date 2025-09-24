export const createRandKey = () => {
  return new Date().getTime() + Math.ceil(Math.random() * 1000) + ''
}

export function getUUID() {
  function S4() {
    return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1)
  }
  return S4() + S4() + '-' + S4() + '-' + S4() + '-' + S4() + '-' + S4() + S4() + S4()
}

// 生成随机数字，max限制最大值，min限制最小值
export const getRandomNumber = (max, min) => {
  return Math.floor(Math.random() * max + (min ? min : 0))
}

/**
 * 重新加载首页
 */
export const reloadHomePage = () => {
  const url = window.location.href
  let toPath = '/'
  if (url.indexOf('#') > -1) {
    toPath = url.split('#')[0]
  }
  window.location.href = toPath
}

/**
 * 解析路由的key
 * @param route
 * @returns
 */
export const parseRouteKey = (route) => {
  let key = encodeURIComponent(`${route.query.key}`)
  if (route.meta.keepKey) {
    key = route.meta.keepKey + ''
  } else if (typeof route.meta.keepKey === 'function') {
    key = route.meta.keepKey(route)
  } else if (route.name) {
    key = route.name
  }
  return key
}

/**
 * 复制文本到剪切板
 * @param text
 * @returns
 */
export const copyTextToClipboard = (text) => {
  const element = document.createElement('textarea')
  element.value = text
  element.setAttribute('readonly', '')
  element.style.position = 'absolute'
  element.style.left = '-9999px'
  element.style.fontSize = '12pt'
  const selection = document.getSelection()
  let originalRange
  if (selection && selection.rangeCount > 0) {
    originalRange = selection.getRangeAt(0)
  }
  document.body.append(element)
  element.select()
  element.selectionStart = 0
  element.selectionEnd = text.length
  let isSuccess = false
  try {
    document.execCommand('copy')
    isSuccess = true
  } catch (e) {
    console.error(e)
    throw new Error()
  }
  element.remove()
  if (originalRange && selection) {
    selection.removeAllRanges()
    selection.addRange(originalRange)
  }
  return isSuccess
}

/**
 * 将文本内的特殊标记替换成html
 * @param {string} text
 * @returns
 */
export const textToHtml = (text) => {
  return text ? text.replace(/ /g, '&nbsp;').replace(/\r\n/g, '<br>') : ''
}

// 获取对象中指定key的值
export const getObjectValueByKey = (key, obj) => {
  let value = obj
  if (key && key.indexOf('.') > -1) {
    const keysArr = key.split('.')
    for (let i = 0; i < keysArr.length; i++) {
      const k = keysArr[i]
      if (k && typeof value === 'object') {
        value = value[k]
      }
    }
  } else if (key) {
    value = value[key]
  }
  return value
}

//  设置对象中指定key的值
export const setObjectValueByKey = (obj, key, value) => {
  const res = obj
  if (key && key.indexOf('.') > -1) {
    const keysArr = key.split('.')
    let find = res
    for (let i = 0; i < keysArr.length; i++) {
      const k = keysArr[i]
      if (i >= keysArr.length - 1 && find[k]) {
        find[k] = value
      } else if (find[k]) {
        find = find[k]
      }
    }
  } else if (key && res[key]) {
    res[key] = value
  }
  return res
}

// 利用正则表达式判断字符串是否只包含数字
export const isNumber = (str) => {
  const reg = /^\d+$/
  return reg.test(str)
}

/**
 * 修改url中的参数
 * @param uri
 * @param key
 * @param value
 * @returns
 */
export const updateQueryStringParameter = (uri, key, value) => {
  if (!value) {
    return uri
  }
  const re = new RegExp('([?&])' + key + '=.*?(&|$)', 'i')
  const separator = uri.indexOf('?') !== -1 ? '&' : '?'
  if (uri.match(re)) {
    return uri.replace(re, '$1' + key + '=' + value + '$2')
  } else {
    return uri + separator + key + '=' + value
  }
}

/**
 * 设置当前url的参数
 * @param field
 * @param val
 */
export const setUrlParameter = (field, val) => {
  const newurl = updateQueryStringParameter(window.location.href, field, val)
  //向当前url添加参数，没有历史记录
  window.history.replaceState(
    {
      path: newurl,
    },
    '',
    newurl,
  )
}

// 获取url参数
export const getUrlParams = (url) => {
  const params = {}
  const urlParams = new URLSearchParams(url)
  urlParams.forEach((value, key) => {
    params[key] = value
  })
  return params
}
