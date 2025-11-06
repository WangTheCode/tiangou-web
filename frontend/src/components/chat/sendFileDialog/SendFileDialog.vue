<template>
  <el-dialog
    v-model="isShow"
    width="500"
    align-center
    :show-close="false"
    class="dialog-p0"
    @close="onCancelModal"
  >
    <template #header>
      <div class="p-4 bg-gray-200">
        <div class="font-bold text-center">{{ title }}</div>
      </div>
    </template>
    <div
      v-if="type === MessageContentTypeConst.image"
      class="flex p-4 text-center items-center justify-center"
    >
      <img
        :src="fileData.url"
        alt="图片"
        :style="{ width: fileData.width + 'px', height: fileData.height + 'px' }"
        class="max-w-full max-h-[400px] w-auto"
      />
    </div>
    <div
      v-else-if="type === MessageContentTypeConst.video"
      class="flex p-4 text-center items-center justify-center"
    >
      <video :src="fileData.url" class="max-w-full max-h-[400px] w-auto" />
    </div>
    <div v-if="type === MessageContentTypeConst.file" class="flex p-4">
      <div class="w-14 h-14 rounded p-2" :style="{ backgroundColor: fileData.color }">
        <img :src="fileData.icon" class="w-full h-full object-cover" />
      </div>
      <div class="flex-1 pl-2">
        <div class="text-sm mb-2">
          {{ fileData.name }}
        </div>
        <div class="text-sm text-gray-400">
          {{ FileHelper.getFileSizeFormat(fileData.size || 0) }}
        </div>
      </div>
    </div>
    <div class="flex gap-2 p-4 pt-0 justify-end">
      <el-button @click="onCancelModal">取消</el-button>
      <el-button type="primary" @click="onSubmit">发送</el-button>
    </div>
  </el-dialog>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { MessageContentTypeConst } from '@/wksdk/const'
import FileHelper from '@/utils/helper/fileHelper'

const props = defineProps({
  file: {
    type: File,
    default: () => null,
  },
  onCancel: {
    type: Function,
    default: () => {},
  },
  onSubmit: {
    type: Function,
    default: () => {},
  },
})

const title = ref('发送图片')
const isShow = ref(false)
const type = ref(MessageContentTypeConst.image)
const fileData = ref({})

// 取消按钮点击
const onCancelModal = () => {
  isShow.value = false
  props.onCancel && props.onCancel()
}

const onSubmit = () => {
  props.onSubmit &&
    props.onSubmit(fileData.value).then(() => {
      onCancelModal()
    })
}
const showFile = (file) => {
  if (file.type && file.type.startsWith('image/')) {
    title.value = '发送图片'
    type.value = MessageContentTypeConst.image
    handleFileToImage(file)
  } else if (file.type && file.type.startsWith('video/')) {
    title.value = '发送视频'
    type.value = MessageContentTypeConst.video
  } else {
    title.value = '发送文件'
    type.value = MessageContentTypeConst.file
    const fileIcon = FileHelper.getFileIconInfo(file.name)
    fileData.value = {
      name: file.name,
      type: file.type,
      size: file.size,
      icon: fileIcon.icon,
      color: fileIcon.color,
    }
  }
}

const handleFileToImage = (file) => {
  const reader = new FileReader()
  reader.readAsDataURL(file)
  reader.onloadend = function () {
    // 创建Image对象来获取图片原始尺寸
    const img = new Image()
    img.onload = function () {
      fileData.value = {
        width: img.naturalWidth,
        height: img.naturalHeight,
        name: file.name,
        type: file.type,
        size: file.size,
        url: reader.result,
      }
    }
    img.src = reader.result
  }
}
showFile(props.file)

onMounted(() => {
  isShow.value = true
})
</script>

<style lang="less" scoped></style>
