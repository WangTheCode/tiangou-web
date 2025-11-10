<template>
  <div class="h-[100vh] flex">
    <el-splitter>
      <el-splitter-panel size="320px" min="220px" max="520px">
        <div class="h-full w-full flex flex-col">
          <div class="overflow-y-auto p-2 flex-1">
            <ChatConversationList v-show="currentActiveTab === 'conversation'" />
            <ChatContactList v-show="currentActiveTab === 'contact'" />
            <!-- <ChatGroupList v-show="currentActiveTab === 'group'" /> -->
          </div>
          <div class="flex items-center justify-center border-t border-gray-200 text-[0]">
            <div
              class="flex-1 text-center py-3 hover:bg-gray-100 cursor-pointer"
              @click="currentActiveTab = 'conversation'"
            >
              <SvgLoad
                name="icon-mb"
                :color="currentActiveTab === 'conversation' ? '#785bf6' : '#999'"
              />
            </div>
            <div
              class="flex-1 text-center py-3 hover:bg-gray-100 cursor-pointer"
              @click="currentActiveTab = 'contact'"
            >
              <SvgLoad
                name="icon-mb"
                :color="currentActiveTab === 'contact' ? '#785bf6' : '#999'"
              />
            </div>
            <div
              class="flex-1 text-center py-3 hover:bg-gray-100 cursor-pointer"
              @click="currentActiveTab = 'group'"
            >
              <SvgLoad name="icon-mb" :color="currentActiveTab === 'group' ? '#785bf6' : '#999'" />
            </div>
          </div>
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
import ChatContactList from './contactsList/ContactsList.vue'
import ChatInput from './ChatInput.vue'
import { init } from '@/wksdk/main'
const userStore = useUserStore()
const chatStore = useChatStore()

init()

const currentActiveTab = ref('conversation')
</script>

<style lang="less" scoped></style>
