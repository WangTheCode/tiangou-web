<template>
  <div class="h-[100vh] flex">
    <div class="h-full overflow-y-auto w-[260px] border-r border-gray-200">
      <div class="w-full">
       <ConversationItem v-for="item in conversationList" :key="item.id" :item="item" />
      </div>
    </div>
    <div>
      66
    </div>
  </div>
</template>

<script setup>
import { Button } from '@global/components'
import ConversationItem from '@global/components/chat/conversationItem.vue'
import ipcApiRoute from '@global/icp/ipcRoute'
import authApi from '@global/api/auth'
import { useUserStore } from '@global/stores/index'
import { useWKSDK } from '@global/hooks/useWKSDK'

const userStore = useUserStore()
const { connectWebSocket } = useWKSDK()
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