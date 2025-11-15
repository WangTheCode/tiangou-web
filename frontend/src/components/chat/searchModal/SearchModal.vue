<template>
  <el-dialog v-model="isShow" :show-close="false" width="800" @close="onCancelModal">
    <template #header>
      <div class="flex items-center justify-between">
        <div class="text-base leading-8 flex-1">{{ title }}</div>
        <div>
          <IconButton round @click="onCancelModal">
            <i class="iconfont icon-close" />
          </IconButton>
        </div>
      </div>
    </template>
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
      <el-tab-pane v-if="!(channel && channel.channelID)" label="联系人" name="friend">
        <ChannelList ref="friendListRef" resultField="friends" @close="onCancelModal" />
      </el-tab-pane>
      <el-tab-pane v-if="!(channel && channel.channelID)" label="群组" name="group">
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
import { getChannelInfo } from '@/wksdk/channelManager'
import IconButton from '@/components/base/IconButton.vue'

const props = defineProps({
  // 指定查询的频道
  channel: {
    type: Object,
    default: () => {},
  },
  onCancel: {
    type: Function,
    default: () => {},
  },
})

const isShow = ref(false)
const keyword = ref('')
const title = ref('搜索')
const activeTab = ref('message')
const messageListRef = ref(null)
const friendListRef = ref(null)
const groupListRef = ref(null)
const fileListRef = ref(null)

const renderTitle = () => {
  if (props.channel) {
    const channelInfo = getChannelInfo(props.channel)
    const displayName =
      channelInfo.orgData && channelInfo.orgData.displayName ? channelInfo.orgData.displayName : ''
    title.value = `与${displayName}的聊天记录`
    return
  }
  title.value = '搜索'
}
renderTitle()
// 取消按钮点击
const onCancelModal = () => {
  isShow.value = false
  props.onCancel && props.onCancel()
}

const handleSearch = () => {
  const params = {
    keyword: keyword.value,
    content_type: [],
  }
  if (props.channel) {
    params.channel_id = props.channel.channelID
    params.channel_type = props.channel.channelType
  }
  if (activeTab.value === 'message') {
    messageListRef.value.reLoadData(params)
  } else if (activeTab.value === 'friend') {
    friendListRef.value.reLoadData(params)
  } else if (activeTab.value === 'group') {
    groupListRef.value.reLoadData(params)
  } else if (activeTab.value === 'file') {
    params.content_type = [8]
    fileListRef.value.reLoadData(params)
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
