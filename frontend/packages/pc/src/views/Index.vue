<template>
  <div class="h-[100vh] flex">
    <div class="h-full overflow-y-auto w-[320px] border-r border-gray-200 p-2">
      <ChatConversationList />
    </div>
    <div class="flex-1 flex flex-col">
      <ChatHeader />
      <ChatMessageList />
      <ChatInput />
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import ChatConversationList from '../components/ChatConversationList.vue'
// import ipcApiRoute from '@global/icp/ipcRoute'
import { useUserStore } from '@global/stores/index'
// import { useImCallback } from '@global/hooks/useImCallback'
// import { useChatStore } from '@global/stores/index'
import ChatHeader from '@global/components/chat/ChatHeader.vue'
import ChatMessageList from '@global/components/chat/ChatMessageList.vue'
import ChatInput from '@global/components/chat/ChatInput.vue'

const userStore = useUserStore()

// const { initImCallback } = useImCallback()
// initImCallback()

// const { init,connectWebSocket } = useWKSDK()
// const chatStore = useChatStore()
// const test = () => {
//   ipcApiRoute.test().then(res => {
//     console.log(res)
//   })
// }
// const userInfo = computed(() => userStore.userInfo)

// const connectWebSocketFn = () => {
//   connectWebSocket({
//     uid: userInfo.value.uid,
//     token: userInfo.value.token,
//   })
// }

// const sendText = () => {
//   ipcApiRoute
//     .sendText({
//       toUid: 'a2cfc4909c4644019fd1cf4a5f6097a7',
//       text: '你好',
//     })
//     .then(res => {
//       console.log(res)
//     })
// }

// const getMessagePageList = () => {
//   ipcApiRoute.getMessagePageList({}).then(res => {
//     console.log(res)
//   })
// }

// const addMessage = () => {
//   ipcApiRoute
//     .addMessage({
//       nickname: '张三',
//       content: '你好',
//     })
//     .then(res => {
//       console.log(res)
//     })
// }
</script>

<style lang="less" scoped></style>
