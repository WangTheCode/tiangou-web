<template>
  <el-dialog
    v-model="isShow"
    :width="width"
    :with-header="false"
    @close="onCancelModal"
    :modal="false"
    :show-close="false"
    align-center
    body-class="body-p-0 "
    class="dialog-p0"
  >
    <template #header>
      <div class="p-4">
        <div class="font-bold text-center">{{ title }}</div>
      </div>
    </template>
    <div class="p-4 mb-4">
      <el-input
        v-if="type === 'input'"
        size="large"
        class="input-gray-bg"
        v-model="text"
        :placeholder="placeholder"
      />
      <el-input
        v-else-if="type === 'textarea'"
        size="large"
        v-model="text"
        :placeholder="placeholder"
        type="textarea"
      />
    </div>
    <div class="flex gap-2 p-4 pt-0 justify-center">
      <el-button @click="onCancelModal" size="large" round style="width: 140px">取消</el-button>
      <el-button type="primary" @click="onSubmit" size="large" round style="width: 140px"
        >确定</el-button
      >
    </div>
  </el-dialog>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'

const props = defineProps({
  onCancel: {
    type: Function,
    default: () => {},
  },
  onSubmit: {
    type: Function,
    default: () => {},
  },
  type: {
    type: String,
    default: 'input',
  },
  width: {
    type: Number,
    default: 380,
  },
  title: {
    type: String,
    default: '请输入内容',
  },
  placeholder: {
    type: String,
    default: '请输入内容',
  },
})

const isShow = ref(false)

const text = ref('')

// 取消按钮点击
const onCancelModal = () => {
  isShow.value = false
  props.onCancel && props.onCancel()
}

const onSubmit = () => {
  props.onSubmit && props.onSubmit(text.value)
  onCancelModal()
}

onMounted(() => {
  isShow.value = true
})
</script>

<style lang="less" scoped></style>
