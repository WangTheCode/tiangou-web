<template>
  <div class="relative">
    <img
      :src="imageData.url"
      :style="{ width: `${imageData.width}px`, height: `${imageData.height}px` }"
      decoding="sync"
    />
    <div
      v-if="message.status == MessageStatus.Wait"
      class="absolute w-full h-full top-0 right-0 flex items-center justify-center bg-black/30"
    >
      <i class="iconfont icon-time"></i>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { MessageContentTypeConst } from '@/wksdk/const'
import { imageScale } from '@/wksdk/utils'
import { MessageStatus } from 'wukongimjssdk'
const props = defineProps({
  message: {
    type: Object,
    required: true,
  },
})
const imageData = computed(() => {
  if (
    props.message &&
    props.message.content &&
    props.message.content.contentType == MessageContentTypeConst.image
  ) {
    if (props.message.content.url) {
      let scaleSize = imageScale(props.message.content.width, props.message.content.height)
      return {
        url: props.message.content.url,
        width: scaleSize.width,
        height: scaleSize.height,
      }
    } else if (props.message.content.contentObj) {
      return props.message.content.contentObj
    } else if (props.message.content.imgData) {
      return {
        url: props.message.content.imgData,
        width: props.message.content.width,
        height: props.message.content.height,
      }
    }
  }
  return {}
})
</script>

<style lang="less" scoped></style>
