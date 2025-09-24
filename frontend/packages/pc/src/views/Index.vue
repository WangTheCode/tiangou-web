<template>
  <div>
    home
    <div>
      <Button @click="test">按钮</Button>
      <Button @click="getMessagePageList">获取消息列表</Button>
      <Button @click="addMessage">添加消息</Button>

    </div>
  </div>
</template>

<script setup>
import { Button } from '@global/components'
import ipcApiRoute from '@global/icp/ipcRoute'

const test = () => {
  ipcApiRoute.test().then(res => {
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