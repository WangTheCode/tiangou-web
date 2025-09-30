<template>
  <div class="h-[100vh] flex">
    <div class="h-full overflow-y-auto w-[320px] border-r border-gray-200 p-2">
      <ChatConversationList />
    </div>
    <div>
      状态
      {{ chatStore.connectStatus }}
    </div>
  </div>
</template>

<script setup>
import ChatConversationList from '../components/ChatConversationList.vue'
import ipcApiRoute from '@global/icp/ipcRoute'
import { useUserStore } from '@global/stores/index'
import { useWKSDK } from '@global/hooks/useWKSDK'
import { useChatStore } from '@global/stores/index'

const userStore = useUserStore()
const { connectWebSocket } = useWKSDK()
const chatStore = useChatStore()
const test = () => {
  ipcApiRoute.test().then(res => {
    console.log(res)
  })
}
const userInfo = computed(() => userStore.userInfo)

const conversationList = ref([
  {
    avatar: 'https://picsum.photos/200/300',
    nickname: '张三',
    time: '2021-01-01',
    content: '你好'
  },
  {
    avatar: 'https://picsum.photos/200/300',
    nickname: '李四',
    time: '2021-01-01',
    content: '你好a'
  }
])


const connectWebSocketFn = () => {
  connectWebSocket({
    uid: userInfo.value.uid,
    token: userInfo.value.token
  })
}




const sendText = () => {
  ipcApiRoute.sendText({
    toUid: 'a2cfc4909c4644019fd1cf4a5f6097a7',
    text: '你好'
  }).then(res => {
    console.log(res)
  })
}

const getMessagePageList = () => {
  ipcApiRoute.getMessagePageList({}).then(res => {
    console.log(res)
  })
}

const addMessage = () => {
  ipcApiRoute.addMessage({
    nickname: '张三',
    content: '你好'
  }).then(res => {
    console.log(res)
  })
}

</script>

<style lang="less" scoped>

</style>