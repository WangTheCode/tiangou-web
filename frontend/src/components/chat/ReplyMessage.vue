<template>
  <div
    v-if="replyMessage && replyMessage.fromUID"
    class="reply-message-container flex items-center mb-2 py-2 border-b border-gray-200"
  >
    <div class="mr-2 border-r border-gray-200 pr-2">
      <i class="iconfont icon-relay text-gray-500"></i>
    </div>
    <div class="flex-1 flex items-center overflow-hidden">
      <Avatar v-if="fromChannel" :channel="fromChannel" shape="circle" :size="30" />
      <div class="ml-2 flex-1 overflow-hidden">
        <div class="text-sm font-medium">{{ displayName }}</div>
        <div class="text-xs text-gray-500 truncate">{{ replyMessageContent }}</div>
      </div>
    </div>

    <div class="ml-2 cursor-pointer pl-2 border-l border-gray-200" @click="handleClose">
      <i class="iconfont icon-close text-gray-400 hover:text-gray-600"></i>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import Avatar from '@/components/base/Avatar.vue'
import { newChannel, getChannelInfo } from '@/wksdk/channelManager'
import { useChatStore } from '@/stores/index'

const chatStore = useChatStore()
const replyMessage = computed(() => chatStore.replyMessage)

// 计算回复消息发送者的频道
const fromChannel = computed(() => {
  if (!replyMessage.value || !replyMessage.value.fromUID) {
    return null
  }
  return newChannel(replyMessage.value.fromUID)
})

// 获取频道信息
const channelInfo = computed(() => {
  if (!fromChannel.value) return null
  return getChannelInfo(fromChannel.value)
})

// 计算显示名称
const displayName = computed(() => {
  return channelInfo.value?.orgData?.displayName || ''
})

// 计算回复消息的内容摘要
const replyMessageContent = computed(() => {
  if (!replyMessage.value) return ''
  return replyMessage.value.content?.conversationDigest || replyMessage.value.content?.text || ''
})

// 关闭回复消息
const handleClose = () => {
  chatStore.setReplyMessage(null)
}
</script>

<style lang="less" scoped></style>
