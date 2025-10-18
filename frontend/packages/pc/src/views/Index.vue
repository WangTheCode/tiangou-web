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
import ChatConversationList from '../components/ChatConversationList.vue'
// import ipcApiRoute from '@global/icp/ipcRoute'
import { useUserStore, useChatStore } from '@global/stores/index'
// import { useImCallback } from '@global/hooks/useImCallback'
// import { useChatStore } from '@global/stores/index'
import ChatHeader from '@global/components/chat/ChatHeader.vue'
import ChatMessageList from '@global/components/chat/ChatMessageList.vue'
import ChatInput from '@global/components/chat/ChatInput.vue'

const userStore = useUserStore()
const chatStore = useChatStore()
// const onSendMessage = chatStore.sendMessage()
</script>

<style lang="less" scoped></style>
