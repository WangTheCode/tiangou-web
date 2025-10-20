<template>
  <div>
    <div class="theme-card">
      {{ appStore.theme }}
    </div>
    <div>
      <a-button @click="setTheme(ThemeEnum.LIGHT)">白</a-button>
      <a-button @click="setTheme(ThemeEnum.DARK)">黑</a-button>
    </div>
    <div>
      <a-button @click="onTestApi">发送请求</a-button>
    </div>
  </div>
</template>

<script setup>
import { useAppStore } from '@/stores'
import { ThemeEnum } from '@/enums/appEnum'
import authApi from '@/api/auth'

const appStore = useAppStore()

const setTheme = (theme) => {
  appStore.setTheme(theme)
}
const onTestApi = async () => {
  const res = await authApi.login({
    username: 'admin',
    password: '123456',
  })
  console.log(res)
}
defineOptions({
  name: 'DemoIndex',
})
</script>

<style lang="less" scoped>
.theme-card {
  background-color: var(--page-background);
  padding: 10px;
  color: var(--text-color);
}
</style>
