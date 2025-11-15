<template>
  <el-drawer
    v-model="isShow"
    :size="width"
    :with-header="false"
    @close="onCancelModal"
    :modal="false"
    modal-penetrable
    :show-close="false"
    align-center
    body-class="body-p-0 "
    class="popup-view"
  >
    <div class="flex flex-col h-full box">
      <div class="flex p-2 border-b border-gray-200">
        <div>
          <IconButton round @click="onCancelModal">
            <i class="iconfont icon-direction-left" size="sm" />
          </IconButton>
        </div>
        <div class="flex-1 pt-2 pl-2">{{ title }}</div>
        <div class="pt-1">
          <el-button type="primary" @click="onSubmit" :loading="loading">{{
            buttonText
          }}</el-button>
        </div>
      </div>
      <div class="flex-1 bg-gray-100 overflow-y-auto p-4">
        <el-input
          v-model="text"
          :placeholder="placeholder"
          type="textarea"
          show-word-limit
          :maxlength="20"
          word-limit-position="outside"
          :rows="4"
        />
        <div v-if="remark" class="text-xs text-gray-500 pt-2">
          {{ remark }}
        </div>
      </div>
    </div>
  </el-drawer>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import IconButton from '@/components/base/IconButton.vue'
import useLoading from '@/hooks/useLoading'

const props = defineProps({
  onCancel: {
    type: Function,
    default: () => {},
  },
  onSubmit: {
    type: Function,
    default: () => {},
  },
  title: {
    type: String,
    default: '',
  },
  leftIcon: {
    type: String,
    default: 'icon-close',
  },
  buttonText: {
    type: String,
    default: '完成',
  },
  placeholder: {
    type: String,
    default: '请输入内容',
  },
  remark: {
    type: String,
    default: '',
  },
  width: {
    type: Number,
    default: 340,
  },
  defaultValue: {
    type: String,
    default: '',
  },
})

const isShow = ref(false)
const text = ref(props.defaultValue)

const { loading, startLoading, endLoading } = useLoading()
// 取消按钮点击
const onCancelModal = () => {
  isShow.value = false
  props.onCancel && props.onCancel()
}

const onSubmit = () => {
  if (loading.value) return
  startLoading()
  try {
    if (props.onSubmit) {
      props.onSubmit(text.value).then(() => {
        onCancelModal()
      })
    } else {
      onCancelModal()
    }
  } finally {
    endLoading()
  }
}

onMounted(() => {
  isShow.value = true
})
</script>

<style lang="less" scoped></style>
