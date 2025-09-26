<template>
  <div>
    home
    <div>

      <Button @click="connectTcp">连接tcp</Button>
      <Button @click="connectWebSocketFn">连接websocket</Button>

      <Button @click="sendText">发送文本</Button>



      <Button @click="test">按钮</Button>
      <Button @click="getMessagePageList">获取消息列表</Button>
      <Button @click="addMessage">添加消息</Button>

    </div>
  </div>
</template>

<script setup>
import { Button } from '@global/components'
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


const connectWebSocketFn = () => {
  connectWebSocket({
    uid: userInfo.value.uid,
    token: userInfo.value.token
  })
}


const connectTcp = () => {
  ipcApiRoute.connectTcp({
    ...userInfo.value
  }).then(res => {
    console.log(res)
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