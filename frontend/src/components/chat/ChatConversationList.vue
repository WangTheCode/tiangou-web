<template>
  <div class="w-full">
    <ConversationItem
      v-for="(item, index) in conversationList"
      :key="index"
      :item="item"
      :is-current="
        currentConversation && currentConversation.channel.channelID === item.channel.channelID
      "
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
</template>

<script setup>
import { computed, ref } from 'vue'
import { useChatStore } from '@/stores/index'
import ConversationItem from './ConversationItem.vue'
import Contextmenu from '@/components/base/Contextmenu.vue'
import { updateSetting, closeConversation } from '@/wksdk/conversationManager'

const chatStore = useChatStore()
const conversationList = computed(() => chatStore.conversationList)
const currentConversation = computed(() => chatStore.currentConversation)
const userInfo = computed(() => chatStore.connectUserInfo)

const handleClick = (item) => {
  chatStore.setCurrentConversation(item)
}

const contextmenuDropdownRef = ref(null)
const contextmenuItems = ref([])
const onContextmenu = (event, item) => {
  console.log(event, item)
  const menuItems = [
    { key: 'top', label: '置顶', icon: 'icon-pin' },
    { key: 'mute', label: '开启免打扰', icon: 'icon-mute' },
    { key: 'close', label: '关闭聊天窗口', icon: 'icon-close' },
    { key: 'forward', label: '清空聊天记录', icon: 'icon-clean' },
    { key: 'select', label: '关闭窗口并清空聊天记录', icon: 'icon-error' },
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
      // chatStore.addSelectedMessage(data)
      break
  }
}
</script>

<style lang="less" scoped></style>
