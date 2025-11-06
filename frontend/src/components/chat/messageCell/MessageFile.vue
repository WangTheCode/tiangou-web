<template>
  <div class="relative">
    <div class="flex cursor-pointer" @click="onDownloadFile">
      <div
        v-if="fileIcon"
        class="w-14 h-14 rounded p-2"
        :style="{ backgroundColor: fileIcon.color }"
      >
        <img :src="fileIcon.icon" class="w-full h-full object-cover" />
      </div>
      <div v-if="message.content" class="flex-1 pl-2">
        <div class="text-sm mb-2">
          {{ message.content.name }}
        </div>
        <div class="text-sm text-gray-400">
          {{ FileHelper.getFileSizeFormat(message.content.size || 0) }}
        </div>
      </div>
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
import { computed } from 'vue'
import { MessageStatus } from 'wukongimjssdk'
import FileHelper from '@/utils/helper/fileHelper'
import { getImageURL } from '@/wksdk/utils'

const props = defineProps({
  message: {
    type: Object,
    required: true,
  },
})

const fileIcon = computed(() => {
  return FileHelper.getFileIconInfo(props.message.content.name)
})

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
