<template>
  <div class="w-[50px] h-[50px] rounded-lg overflow-hidden">
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
const props = defineProps({
  src: {
    type: String,
    default: '',
  },
  channel: {
    type: Object,
    default: () => {},
  },
})

const avatar = computed(() => {
  if (props.src) {
    return props.src
  }
  return avatarChannel(props.channel)
})
</script>

<style lang="scss" scoped></style>
