<template>
  <div>
    <h1>Login</h1>
    <input
      type="text"
      v-model="username"
      placeholder="Username"
    />
    <input
      type="password"
      v-model="password"
      placeholder="Password"
    />
    <button @click="login">Login</button>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { useUserStore, useChatStore } from '@global/stores/index'
const userStore = useUserStore()
const router = useRouter()
const chatStore = useChatStore()
const username = ref('008615512345670')
const password = ref('a1234567')

const login = () => {
  userStore
    .login({
      username: username.value,
      password: password.value,
    })
    .then(res => {
      chatStore.connect(res)
      router.push('/')
    })
}
</script>

<style lang="less" scoped></style>
