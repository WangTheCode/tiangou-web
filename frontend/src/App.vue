<template>
  <!-- <a-config-provider :locale="locale"> -->
  <router-view />
  <!-- </a-config-provider> -->
</template>
<script setup lang="ts">
import { useAppBase } from '@/hooks/useAppBase'
useAppBase()
// import zhCN from 'ant-design-vue/es/locale/zh_CN'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
dayjs.locale('zh-cn')
// const locale = zhCN
</script>

<style></style>
