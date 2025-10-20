<template>
  <div class="h-[100vh] flex">
    <div class="h-full overflow-y-auto w-[320px] border-r border-gray-200 p-2">
      <ChatConversationList />
    </div>
    <div class="flex-1 flex flex-col">
      <ChatHeader />
      <ChatMessageList />
      <ChatInput @send-message="chatStore.sendMessage" />
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import ChatConversationList from './ChatConversationList.vue'
import { useUserStore, useChatStore } from '@/stores/index'
import ChatHeader from './ChatHeader.vue'
import ChatMessageList from './ChatMessageList.vue'
import ChatInput from './ChatInput.vue'

const userStore = useUserStore()
const chatStore = useChatStore()
</script>

<style lang="less" scoped></style>
