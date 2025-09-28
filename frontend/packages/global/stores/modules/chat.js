import { defineStore } from 'pinia'
import piniaStore from '../counter'
import Cache from '../../utils/cache'
import { useTSDD } from '../../hooks/useTSDD'
import authApi from '../../api/auth'
import ipcApiRoute from '../../icp/ipcRoute'


export const useChatStore = defineStore('chat', {
  state: () => ({
    // 通信连接状态
    connectStatus: 'loading', // loading, success, error
     conversationList: [],
  }),
  getters: {},
  actions: {
    connect(userInfo) {
      this.connectStatus = 'loading'
      const { connect } = useTSDD()
      connect(userInfo).then((res) => {
        console.log(res)
        this.connectStatus = 'success'
        this.syncConversationList()
      }).catch((err) => {
        this.connectStatus = 'error'
      })
    },
    syncConversationList() {
      ipcApiRoute.syncConversationList().then((res) => {
        console.log(res)
        this.conversationList = res
      })
     }
  },
})

export function useUserOutsideStore() {
  return useUserStore(piniaStore)
}
