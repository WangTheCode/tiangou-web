<template>
  <!-- <a-config-provider :locale="locale"> -->
  <router-view />
  <!-- </a-config-provider> -->
</template>
<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { useAppBase } from '@/hooks/useAppBase'
useAppBase()
// import zhCN from 'ant-design-vue/es/locale/zh_CN'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
dayjs.locale('zh-cn')
// const locale = zhCN

// 全局禁止右键菜单
const handleContextMenu = (e) => {
  e.preventDefault()
  return false
}

onMounted(() => {
  // 监听右键菜单事件
  document.addEventListener('contextmenu', handleContextMenu)
})

onUnmounted(() => {
  // 组件卸载时移除监听
  document.removeEventListener('contextmenu', handleContextMenu)
})
</script>

<style></style>
