<template>
  <div>
    home
    <div>
      <Button @click="test">按钮</Button>
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

</script>

<style lang="less" scoped>

</style>