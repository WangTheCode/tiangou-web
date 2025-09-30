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
    currentConversation: null,
  }),
  getters: {},
  actions: {
    connect(userInfo) {
      this.connectStatus = 'loading'
      const { connect } = useTSDD()
      connect(userInfo)
    },
    setConnectStatus(status) {
      this.connectStatus = status
      if (status === 'success' && this.conversationList.length === 0) {
        const { syncConversationList } = useTSDD()
        syncConversationList().then(res => {
          this.conversationList = res
        })
      }
    },
    setCurrentConversation(conversation) {
      this.currentConversation = conversation
    },
    // syncConversationList() {
    //   ipcApiRoute.syncConversationList().then((res) => {
    //     console.log(res)
    //     this.conversationList = res
    //   })
    // }
  },
})

export function useUserOutsideStore() {
  return useUserStore(piniaStore)
}
