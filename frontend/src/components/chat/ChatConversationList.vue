<template>
  <div class="w-full">
    <ConversationItem
      v-for="item in conversationList"
      :key="item.channelID"
      :item="item"
      :is-current="
        currentConversation && currentConversation.channel.channelID === item.channel.channelID
      "
      :userInfo="userInfo"
      @click="handleClick(item)"
    />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useChatStore } from '@/stores/index'
import ConversationItem from './ConversationItem.vue'

const chatStore = useChatStore()
const conversationList = computed(() => chatStore.conversationList)
const currentConversation = computed(() => chatStore.currentConversation)
const userInfo = computed(() => chatStore.connectUserInfo)

const handleClick = (item) => {
  chatStore.setCurrentConversation(item)
}
</script>

<style lang="less" scoped></style>
