<template>
  <el-dialog v-model="isShow" width="800" @close="onCancelModal">
    <div>
      <el-input v-model="keyword" placeholder="搜索" @keyup.enter="handleSearch">
        <template #prefix>
          <i class="iconfont icon-search" />
        </template>
      </el-input>
    </div>
    <el-tabs v-model="activeTab" @tab-click="handleTabClick">
      <el-tab-pane label="聊天" name="message">User</el-tab-pane>
      <el-tab-pane label="联系人" name="friend">Config</el-tab-pane>
      <el-tab-pane label="群组" name="group">Role</el-tab-pane>
      <el-tab-pane label="文件" name="file">Task</el-tab-pane>
    </el-tabs>
  </el-dialog>
</template>

<script setup>
import { ref, onMounted } from 'vue'
const props = defineProps({
  onCancel: {
    type: Function,
    default: () => {},
  },
})

const isShow = ref(false)
const keyword = ref('')
const activeTab = ref('message')

// 取消按钮点击
const onCancelModal = () => {
  isShow.value = false
  props.onCancel && props.onCancel()
}

const handleSearch = () => {
  console.log(keyword.value)
}

const handleTabClick = (tab) => {
  console.log(tab)
}

onMounted(() => {
  isShow.value = true
})
</script>

<style lang="less" scoped></style>
