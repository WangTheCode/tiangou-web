<template>
  <div class="h-full w-full flex items-center justify-center flex-col">
    <img class="w-14" :src="imgSrc" :style="{ width: `${imgSize}px` }" />
    <div
      class="text-sm leading-normal text-mb-gray-80 font-normal text-center"
      :style="{ fontSize: `12px` }"
    >
      {{ title }}
    </div>
  </div>
</template>

<script setup>
import { defineProps } from 'vue'
defineProps({
  title: {
    type: String,
    default: 'Oops! There is no data yet!',
  },
  imgSize: {
    type: Number,
    default: 56,
  },
  imgSrc: {
    type: String,
    default: '/images/empty-info.png',
  },
})
</script>

<style lang="less" scoped></style>
