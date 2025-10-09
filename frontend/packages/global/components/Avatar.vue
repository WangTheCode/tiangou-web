<template>
  <div
    class="w-[50px] h-[50px] overflow-hidden"
    :class="shapeClass"
  >
    <img
      :src="avatar"
      alt=""
      class="w-full h-full object-cover"
    />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { avatarChannel } from '@global/tsdd/index'

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
    validator: value => ['circle', 'square'].includes(value),
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
