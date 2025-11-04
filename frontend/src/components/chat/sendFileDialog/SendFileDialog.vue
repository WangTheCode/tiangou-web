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
    <div class="flex flex-col p-4">
      <img :src="imageUrl" alt="图片" class="max-w-full max-h-[500px] w-auto" />
    </div>
    <div class="flex gap-2 p-4 pt-0 justify-end">
      <el-button @click="onCancelModal">取消</el-button>
      <el-button type="primary" @click="onSubmit">发送</el-button>
    </div>
  </el-dialog>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

const props = defineProps({
  title: {
    type: String,
    default: '发送图片',
  },
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

const isShow = ref(false)
const imageUrl = ref('')
const width = ref(0)
const height = ref(0)

// 取消按钮点击
const onCancelModal = () => {
  isShow.value = false
  props.onCancel && props.onCancel()
}

const onSubmit = () => {
  const imgObj = {
    previewUrl: imageUrl.value,
    width: width.value,
    height: height.value,
  }
  props.onSubmit && props.onSubmit(imgObj)
}

const handleFileToImage = (file) => {
  const reader = new FileReader()
  reader.readAsDataURL(file)
  reader.onloadend = function (e) {
    imageUrl.value = reader.result
    width.value = e.target.width
    height.value = e.target.height
  }
}
handleFileToImage(props.file)

onMounted(() => {
  isShow.value = true
})
</script>

<style lang="less" scoped></style>
