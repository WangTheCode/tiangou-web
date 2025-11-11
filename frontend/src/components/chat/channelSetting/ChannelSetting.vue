<template>
  <el-drawer v-model="isShow" width="300" :with-header="false" @close="onCancelModal">
    666
  </el-drawer>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
const props = defineProps({
  onCancel: {
    type: Function,
    default: () => {},
  },
})

const isShow = ref(false)
// 取消按钮点击
const onCancelModal = () => {
  isShow.value = false
  props.onCancel && props.onCancel()
}

onMounted(() => {
  isShow.value = true
})
</script>

<style lang="less" scoped></style>
