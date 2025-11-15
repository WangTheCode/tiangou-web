<template>
  <div class="avatar-cropper">
    <!-- 裁剪模式 -->
    <div v-if="isCropping" class="cropper-container">
      <div class="cropper-box">
        <VueCropper
          ref="cropperRef"
          :img="cropperSrc"
          :output-size="1"
          :output-type="'jpeg'"
          :info="true"
          :full="false"
          :can-move="true"
          :can-move-box="true"
          :fixed-box="false"
          :original="false"
          :auto-crop="true"
          :auto-crop-width="200"
          :auto-crop-height="200"
          :center-box="true"
          :fixed="true"
          :fixed-number="[1, 1]"
        />
      </div>
      <div class="cropper-actions">
        <el-button @click="zoomIn" circle>
          <i class="iconfont icon-add" />
        </el-button>
        <el-button @click="zoomOut" circle>
          <i class="iconfont icon-reduce" />
        </el-button>
        <el-button @click="rotateLeft" circle>
          <i class="iconfont icon-rotate-left" />
        </el-button>
        <el-button @click="rotateRight" circle>
          <i class="iconfont icon-rotate-right" />
        </el-button>
        <div class="flex-1"></div>
        <el-button @click="cancelCrop">取消</el-button>
        <el-button type="primary" @click="confirmCrop">确认</el-button>
      </div>
    </div>

    <!-- 预览模式 -->
    <div v-else class="preview-container">
      <div class="preview-box">
        <img v-if="src" :src="src" alt="头像" class="preview-img" />
        <div v-else class="preview-empty">
          <i class="iconfont icon-avatar" style="font-size: 60px; color: #ccc" />
        </div>
      </div>
      <div class="preview-actions">
        <el-button type="primary" @click="selectImage">更换头像</el-button>
      </div>
    </div>

    <!-- 隐藏的文件输入框 -->
    <input
      ref="fileInputRef"
      type="file"
      accept="image/*"
      style="display: none"
      @change="handleFileChange"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import 'vue-cropper/dist/index.css'
import { VueCropper } from 'vue-cropper'

const cropperRef = ref(null)
const fileInputRef = ref(null)

defineProps({
  src: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['change', 'cancel'])

const isCropping = ref(false)
const cropperSrc = ref('')

// 选择图片
const selectImage = () => {
  fileInputRef.value?.click()
}

// 处理文件选择
const handleFileChange = (e) => {
  const file = e.target.files?.[0]
  if (!file) return

  // 检查文件类型
  if (!file.type.startsWith('image/')) {
    console.error('请选择图片文件')
    return
  }

  // 读取文件并显示裁剪器
  const reader = new FileReader()
  reader.onload = (event) => {
    cropperSrc.value = event.target.result
    isCropping.value = true
  }
  reader.readAsDataURL(file)

  // 清空 input，允许选择相同文件
  e.target.value = ''
}

// 放大
const zoomIn = () => {
  cropperRef.value?.changeScale(1)
}

// 缩小
const zoomOut = () => {
  cropperRef.value?.changeScale(-1)
}

// 左旋转
const rotateLeft = () => {
  cropperRef.value?.rotateLeft()
}

// 右旋转
const rotateRight = () => {
  cropperRef.value?.rotateRight()
}

// 取消裁剪
const cancelCrop = () => {
  isCropping.value = false
  cropperSrc.value = ''
  emit('cancel')
}

// 确认裁剪
const confirmCrop = () => {
  if (!cropperRef.value) return

  // 获取裁剪后的 Blob
  cropperRef.value.getCropBlob((blob) => {
    // 创建 File 对象
    const file = new File([blob], 'avatar.jpg', { type: 'image/jpeg' })

    // 创建预览 URL
    const previewUrl = URL.createObjectURL(blob)

    emit('change', {
      file, // File 对象，可用于上传
      blob, // Blob 对象
      url: previewUrl, // 预览 URL
    })

    isCropping.value = false
    cropperSrc.value = ''
  })
}
</script>

<style lang="less" scoped>
.avatar-cropper {
  width: 100%;
}

.cropper-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.cropper-box {
  width: 100%;
  height: 400px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  overflow: hidden;
  background: #f5f5f5;
}

.cropper-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.preview-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.preview-box {
  width: 200px;
  height: 200px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f5f5;
}

.preview-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.preview-empty {
  display: flex;
  align-items: center;
  justify-content: center;
}

.preview-actions {
  text-align: center;
}
</style>
