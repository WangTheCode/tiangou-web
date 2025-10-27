<template>
  <div class="flex border-l-4 border-blue-300 p-2 bg-blue-100 rounded-md overflow-hidden">
    <Avatar :size="20" :src="avatarUser(message.content.reply.fromUID)" shape="circle" />
    <div class="flex-1 pl-2">
      <div class="text-sm font-medium text-blue-600">{{ message.content.reply.fromName }}</div>
      <div
        v-if="message.content.reply.content && message.content.reply.content.conversationDigest"
        class="text-xs text-gray-900 truncate"
      >
        {{ message.content.reply.content.conversationDigest }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { avatarUser } from '@/wksdk/channelManager'
import Avatar from '@/components/base/Avatar.vue'
const props = defineProps({
  message: {
    type: Object,
    required: true,
  },
})
</script>

<style lang="less" scoped></style>
