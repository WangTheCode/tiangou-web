<template>
  <i class="iconfont" :class="icon"></i>
</template>

<script setup>
defineProps({
  icon: {
    type: String,
    required: true,
  },
})
</script>

<style lang="less" scoped></style>
