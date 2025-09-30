<template>
  <div class="w-full">
    <ConversationItem
      v-for="item in conversationList"
      :key="item.id"
      :item="item"
      :is-current="
        currentConversation && currentConversation.channel.channelID === item.channel.channelID
      "
      @click="handleClick(item)"
    />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useChatStore } from '@global/stores/index'
import ConversationItem from '@global/components/chat/ConversationItem.vue'

const chatStore = useChatStore()
const conversationList = computed(() => chatStore.conversationList)
const currentConversation = computed(() => chatStore.currentConversation)

const handleClick = item => {
  chatStore.setCurrentConversation(item)
}
</script>

<style lang="less" scoped></style>
