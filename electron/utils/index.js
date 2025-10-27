/**
 * 所有方法接收两个参数
 * @param args 前端传的参数
 * @param event - ipc通信时才有值。详情见：控制器文档
 */
function show(data, code = 0, message = 'success') {
  return {
    code: code,
    data: data,
    message: message,
  }
}

function getJson(args) {
  try {
    if (!args) {
      return {}
    }
    return JSON.parse(args)
  } catch (error) {
    return {}
  }
}

function getUUID() {
  function S4() {
    return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1)
  }
  return S4() + S4() + '-' + S4() + '-' + S4() + '-' + S4() + '-' + S4() + S4() + S4()
}

module.exports = {
  show,
  getJson,
  getUUID,
}
