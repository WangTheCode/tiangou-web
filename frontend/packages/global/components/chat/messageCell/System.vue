<template>
  <div class="text-blue-950 text-center text-xs p-4">
    {{ content }}
  </div>
</template>

<script setup>
import { computed } from 'vue'
const props = defineProps({
  message: {
    type: Object,
    required: true,
  },
})
const content = computed(() => {
  if (props.message && props.message.content && props.message.content.displayText) {
    return props.message.content.displayText
  }
  return ''
})
defineOptions({
  name: 'MessageSystem',
})
</script>

<style lang="less" scoped></style>
