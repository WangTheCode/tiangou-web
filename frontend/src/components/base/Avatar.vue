<template>
  <div
    :class="['overflow-hidden', shapeClass]"
    :style="{ width: size + 'px', height: size + 'px' }"
  >
    <img :src="avatar" alt="" class="w-full h-full object-cover" />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { avatarChannel } from '@/wksdk/channelManager'

defineOptions({
  name: 'UserAvatar',
})

const props = defineProps({
  src: {
    type: String,
    default: '',
  },
  channel: {
    type: Object,
    default: () => {},
  },
  shape: {
    type: String,
    default: 'square',
    validator: (value) => ['circle', 'square'].includes(value),
  },
  size: {
    type: Number,
    default: 50,
  },
})

const avatar = computed(() => {
  if (props.src) {
    return props.src
  }
  return avatarChannel(props.channel)
})

const shapeClass = computed(() => {
  return props.shape === 'circle' ? 'rounded-full' : 'rounded-lg'
})
</script>

<style lang="less" scoped></style>
