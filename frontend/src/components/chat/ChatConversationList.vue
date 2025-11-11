<template>
  <div>
    <div class="px-2 py-1 flex bg-gray-100 mb-2">
      <div class="flex-1 leading-[40px]">
        <span v-if="connectStatus === 'loading'">连接中</span>
        <span v-else-if="connectStatus === 'success'">在线</span>
        <span v-else>离线</span>
      </div>
      <IconButton icon="icon-search" iconSize="20px" @click="onShowSearchModal" />
      <el-dropdown>
        <IconButton icon="icon-add" iconSize="20px" />
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item>
              <i class="iconfont icon-chat-group-add"></i>
              添加群聊
            </el-dropdown-item>
            <el-dropdown-item>
              <i class="iconfont icon-add-user"></i>
              添加好友
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
    <div class="w-full">
      <ConversationItem
        v-for="(item, index) in conversationList"
        :key="index"
        :item="item"
        :is-current="currentChannel && currentChannel.channelID === item.channel.channelID"
        :userInfo="userInfo"
        @click="handleClick(item)"
        @contextmenu="onContextmenu($event, item)"
      />
      <Contextmenu
        ref="contextmenuDropdownRef"
        :menu-items="contextmenuItems"
        @select="onContextmenuSelect"
      />
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useChatStore } from '@/stores/index'
import ConversationItem from './ConversationItem.vue'
import Contextmenu from '@/components/base/Contextmenu.vue'
import { updateSetting, closeConversation, clearChannelMessages } from '@/wksdk/conversationManager'
import IconButton from '@/components/base/IconButton.vue'
import { chatSearchModal } from './searchModal/index'

const chatStore = useChatStore()
const conversationList = computed(() => chatStore.conversationList)
const currentChannel = computed(() => chatStore.currentChannel)
const userInfo = computed(() => chatStore.connectUserInfo)
const connectStatus = computed(() => chatStore.connectStatus)

const handleClick = (item) => {
  chatStore.setCurrentChannel(item.channel)
}

const contextmenuDropdownRef = ref(null)
const contextmenuItems = ref([])
const onContextmenu = (event, item) => {
  const menuItems = [
    { key: 'top', label: '置顶', icon: 'icon-pin' },
    { key: 'mute', label: '开启免打扰', icon: 'icon-mute' },
    { key: 'close', label: '关闭聊天窗口', icon: 'icon-close' },
    { key: 'clearMessages', label: '清空聊天记录', icon: 'icon-clean' },
    { key: 'closeAndClearMessages', label: '关闭窗口并清空聊天记录', icon: 'icon-error' },
  ]
  if (item.extra && item.extra.top) {
    menuItems[0].label = '取消置顶'
    menuItems[0].icon = 'icon-unpin'
  }
  if (item.channelInfo && item.channelInfo.mute) {
    menuItems[1].label = '关闭免打扰'
    menuItems[1].icon = 'icon-ring'
  }
  contextmenuItems.value = menuItems
  contextmenuDropdownRef.value?.open(event, item)
}

const onContextmenuSelect = (e) => {
  const { key, data } = e
  switch (key) {
    case 'top':
      updateSetting(data, 'top', !data.extra.top)
      break
    case 'mute':
      updateSetting(data, 'mute', !data.channelInfo.mute)
      // copyMessageContent(data)
      break
    case 'close':
      closeConversation(data)
      break
    case 'clearMessages':
      clearChannelMessages(data)
      break
    case 'closeAndClearMessages':
      closeConversation(data)
      clearChannelMessages(data)
      break
  }
}

const onShowSearchModal = () => {
  chatSearchModal({})
}
</script>

<style lang="less" scoped></style>
