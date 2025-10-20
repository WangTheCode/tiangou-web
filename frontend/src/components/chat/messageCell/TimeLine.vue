<template>
  <div class="bubble-base text-gray-700 text-center text-xs flex items-center justify-center">
    <div class="h-[1px] bg-gray-200 flex-1"></div>
    <div class="px-4 font-bold">{{ content }}</div>
    <div class="h-[1px] bg-gray-200 flex-1"></div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import dayjs from 'dayjs'
const props = defineProps({
  message: {
    type: Object,
    required: true,
  },
})
const content = computed(() => {
  if (props.message && props.message.content && props.message.content.timestamp) {
    return dayjs(props.message.content.timestamp * 1000).format('MM月DD日')
  }
  return ''
})
defineOptions({
  name: 'MessageSystem',
})
</script>

<style lang="less" scoped></style>
