<template>
  <div>
    <img :src="image" :style="{ width: imageWidth + 'px' }" />
    <div class="text-2xl text-gray-400">
      <slot></slot> <span v-if="text">{{ text }}</span>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  image: {
    type: String,
    default: '/images/logo.png',
  },
  imageWidth: {
    type: Number,
    default: 200,
  },
  text: {
    type: String,
    default: '',
  },
})
</script>

<style lang="less" scoped></style>
