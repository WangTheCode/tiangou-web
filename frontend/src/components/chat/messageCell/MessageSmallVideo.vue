<template>
  <div class="relative">
    <div class="flex cursor-pointer" @click="onDownloadFile">
      <div
        class="w-14 rounded-full py-1 px-2 absolute top-1 left-1"
        :style="{ backgroundColor: 'rgba(0, 0, 0, 0.1)' }"
      >
        <span class="text-sm text-gray-400">{{ secondTime }}</span>
      </div>
      <video
        v-if="videoUrl"
        :src="videoUrl"
        :poster="posterUrl"
        :width="actSize.width"
        :height="actSize.height"
        controls
        class="max-w-full max-h-[400px] w-auto"
        @timeupdate="onTimeUpdate"
        @ended="onEnded"
      >
        <source :src="videoUrl" type="video/mp4" />
      </video>
    </div>
    <div
      v-if="message.status == MessageStatus.Wait"
      class="absolute w-full h-full top-0 right-0 flex items-center justify-center bg-black/30"
    >
      <i class="iconfont icon-time"></i>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { MessageStatus } from 'wukongimjssdk'
import { getImageURL, videoScale, secondFormat } from '@/wksdk/utils'

const props = defineProps({
  message: {
    type: Object,
    required: true,
  },
})

const playProgress = ref(0)

const secondTime = computed(() => {
  return secondFormat(props.message.content.second - playProgress.value)
})

const posterUrl = computed(() => {
  if (props.message.content && props.message.content.cover && props.message.content.cover !== '') {
    return getImageURL(props.message.content.cover)
  }
  return ''
})
const actSize = computed(() => {
  return videoScale(props.message.content.width, props.message.content.height)
})

const videoUrl = computed(() => {
  if (props.message.content && props.message.content.url && props.message.content.url !== '') {
    return getImageURL(props.message.content.url)
  }
  // 如果是本地文件，使用 object URL
  if (props.message.content && props.message.content.file) {
    return URL.createObjectURL(props.message.content.file)
  }
  return ''
})

const onTimeUpdate = (event) => {
  playProgress.value = event.target.currentTime
}
const onEnded = () => {
  playProgress.value = 0
}

const onDownloadFile = () => {
  const content = props.message.content
  let downloadURL = getImageURL(content.url || '')
  if (downloadURL.indexOf('?') != -1) {
    downloadURL += '&filename=' + content.name
  } else {
    downloadURL += '?filename=' + content.name
  }
  window.open(`${downloadURL}`, 'top')
}
</script>

<style lang="less" scoped></style>
