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
      <el-tab-pane label="聊天" name="message">
        <MessageList ref="messageListRef" @close="onCancelModal" />
      </el-tab-pane>
      <el-tab-pane label="联系人" name="friend">
        <ChannelList ref="friendListRef" resultField="friends" @close="onCancelModal" />
      </el-tab-pane>
      <el-tab-pane label="群组" name="group">
        <ChannelList ref="groupListRef" resultField="groups" @close="onCancelModal" />
      </el-tab-pane>
      <el-tab-pane label="文件" name="file">
        <FileList ref="fileListRef" resultField="messages" />
      </el-tab-pane>
    </el-tabs>
  </el-dialog>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import MessageList from './MessageList.vue'
import ChannelList from './ChannelList.vue'
import FileList from './FileList.vue'
const props = defineProps({
  onCancel: {
    type: Function,
    default: () => {},
  },
})

const isShow = ref(false)
const keyword = ref('')
const activeTab = ref('message')
const messageListRef = ref(null)
const friendListRef = ref(null)
const groupListRef = ref(null)
const fileListRef = ref(null)
// 取消按钮点击
const onCancelModal = () => {
  isShow.value = false
  props.onCancel && props.onCancel()
}

const handleSearch = () => {
  if (activeTab.value === 'message') {
    messageListRef.value.reLoadData({
      keyword: keyword.value,
      content_type: [],
    })
  } else if (activeTab.value === 'friend') {
    friendListRef.value.reLoadData({
      keyword: keyword.value,
      content_type: [],
    })
  } else if (activeTab.value === 'group') {
    groupListRef.value.reLoadData({
      keyword: keyword.value,
      content_type: [],
    })
  } else if (activeTab.value === 'file') {
    fileListRef.value.reLoadData({
      keyword: keyword.value,
      content_type: [8],
    })
  }
}

const handleTabClick = () => {
  // console.log(tab.paneName)
  nextTick(() => {
    handleSearch()
  })
}

onMounted(() => {
  isShow.value = true
  nextTick(() => {
    handleSearch()
  })
})
</script>

<style lang="less" scoped></style>
