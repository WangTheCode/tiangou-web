<template>
  <div class="h-[100vh] flex">
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

          <ChatInput />
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
import { init } from '@/wksdk/main'
const userStore = useUserStore()
const chatStore = useChatStore()

init()
</script>

<style lang="less" scoped></style>
