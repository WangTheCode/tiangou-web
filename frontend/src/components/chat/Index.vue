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
                :name="currentActiveTab === 'conversation' ? 'icon-message' : 'icon-message-o'"
                :color="currentActiveTab === 'conversation' ? '#785bf6' : '#999'"
              />
            </div>
            <div
              class="flex-1 text-center py-3 hover:bg-gray-100 cursor-pointer"
              @click="currentActiveTab = 'contact'"
            >
              <SvgLoad
                :name="currentActiveTab === 'contact' ? 'icon-user' : 'icon-user-o'"
                :color="currentActiveTab === 'contact' ? '#785bf6' : '#999'"
              />
            </div>
            <div
              class="flex-1 text-center py-3 hover:bg-gray-100 cursor-pointer"
              @click="currentActiveTab = 'user'"
            >
              <!-- <SvgLoad name="icon-mb" :color="currentActiveTab === 'group' ? '#785bf6' : '#999'" /> -->
              <SvgLoad
                :name="currentActiveTab === 'user' ? 'icon-my' : 'icon-my-o'"
                :color="currentActiveTab === 'user' ? '#785bf6' : '#999'"
              />
            </div>
          </div>
        </div>
      </el-splitter-panel>
      <el-splitter-panel :min="200">
        <div v-if="currentChannel && currentChannel.channelID" class="flex-1 flex flex-col h-full">
          <ChatHeader />
          <ChatMessageList />

          <ChatInput />
        </div>
        <div v-else class="flex items-center justify-center h-full">
          <!-- <Logo class="text-center">
            <span class="text-black"
              >来窝里，遇见心有灵犀的<span class="text-primary">ta</span></span
            >
          </Logo> -->
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
import Logo from '@/components/ui/Logo.vue'

const userStore = useUserStore()
const chatStore = useChatStore()

const currentChannel = computed(() => chatStore.currentChannel)

init()

const currentActiveTab = ref('conversation')
const keyword = ref('')

const handleSearch = () => {
  console.log(keyword.value)
}
</script>

<style lang="less" scoped></style>
