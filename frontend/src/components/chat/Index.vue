<template>
  <div class="h-[100vh] flex">
    <!-- <div class="h-full overflow-y-auto w-[320px] border-r border-gray-200 p-2">
      <ChatConversationList />
    </div>
    <div class="flex-1 flex flex-col">
      <ChatHeader />
      <ChatMessageList />
      <ChatInput @send-message="chatStore.sendMessage" />
    </div> -->
    <el-splitter>
      <el-splitter-panel size="320px" min="220px" max="520px">
        <div class="h-full overflow-y-auto w-full p-2">
          <ChatConversationList />
        </div>
      </el-splitter-panel>
      <el-splitter-panel :min="200">
        <div class="flex-1 flex flex-col h-full">
          <ChatHeader />
          <ChatMessageList />
          
          <ChatInput @send-message="chatStore.sendMessage" />
        </div>
      </el-splitter-panel>
    </el-splitter>
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
