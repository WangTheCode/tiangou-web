<template>
  <span
    class="badge w-4 h-4 rounded-full flex items-center justify-center bg-red-500 text-white text-xs inline-block"
  >
    {{ count }}
  </span>
</template>

<script setup>
const props = defineProps({
  count: {
    type: Number,
    default: 0,
  },
})
</script>

<style lang="less" scoped></style>
