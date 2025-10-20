<template>
  <div>
    <h1>Login</h1>
    <input v-model="username" type="text" placeholder="Username" />
    <input v-model="password" type="password" placeholder="Password" />
    <button @click="login">Login</button>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore, useChatStore } from '@/stores/index'
const userStore = useUserStore()
const router = useRouter()
const chatStore = useChatStore()
const username = ref('008613155550002')
const password = ref('123456')

const login = () => {
  userStore
    .login({
      username: username.value,
      password: password.value,
    })
    .then((res) => {
      chatStore.connectIm(res)
      router.push('/')
    })
}
</script>

<style lang="less" scoped></style>
