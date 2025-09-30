import { ref } from 'vue'
import WKSDK, { ConnectStatus } from 'wukongimjssdk'
export const useWKSDK = () => {
  const connectWebSocket = options => {
    return new Promise((resolve, reject) => {
      const { uid, token } = options
      // WKSDK.shared().config.addr = 'wss://tgdd-ws.jx3kaihe.top'; // 默认端口为5200
      WKSDK.shared().config.addr = import.meta.env.VITE_WS_HOST
      // 认证信息
      WKSDK.shared().config.uid = uid // 用户uid（需要在悟空通讯端注册过）
      WKSDK.shared().config.token = token // 用户token （需要在悟空通讯端注册过）

      WKSDK.shared().connectManager.addConnectStatusListener((status, reasonCode) => {
        console.log('连接状态', status, reasonCode)
        if (status === ConnectStatus.Connected) {
          console.log('连接成功')
        } else {
          console.log('连接失败', reasonCode) //  reasonCode: 2表示认证失败（uid或token错误）
        }
      })

      WKSDK.shared().connectManager.connect()
      resolve(true)
    })
  }

  return {
    connectWebSocket,
  }
}
