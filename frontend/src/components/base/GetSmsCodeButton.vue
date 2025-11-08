<template>
  <el-button
    size="large"
    type="primary"
    @click="sendCode"
    block
    :disabled="countdown > 0"
    class="w-full"
  >
    {{ countdown > 0 ? `${countdown}秒后重试` : '获取验证码' }}
  </el-button>
</template>

<script setup>
import { ref, onBeforeUnmount } from 'vue'
import commonApi from '@/api/common'

const props = defineProps({
  getSendData: {
    type: Function,
    required: true,
  },
})

// 倒计时秒数
const countdown = ref(0)
// 定时器引用
let timer = null

// 发送验证码
const sendCode = async () => {
  try {
    const sendData = await props.getSendData()
    const res = await commonApi.sendSmsCode(sendData)

    console.log(res)

    // 发送成功后启动倒计时
    startCountdown()
  } catch (error) {
    console.error(error)
  }
}

// 启动倒计时
const startCountdown = () => {
  countdown.value = 60

  timer = setInterval(() => {
    countdown.value--

    // 倒计时结束，清除定时器
    if (countdown.value <= 0) {
      clearInterval(timer)
      timer = null
    }
  }, 1000)
}

// 组件卸载时清理定时器
onBeforeUnmount(() => {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
})
</script>

<style lang="less" scoped></style>
