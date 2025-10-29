<template>
  <div
    class="border border-gray-200 rounded-md p-2 bg-white text-black cursor-pointer"
    @click="showMessageList"
  >
    <div class="mb-1 font-bold">
      {{ title }}
    </div>
    <div class="text-xs text-gray-500">
      <div v-for="msg in msgs" :key="msg.fromUID">{{ msg.name }}: {{ msg.text }}</div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { ChannelTypeGroup } from 'wukongimjssdk'
import { getChannelInfo, newChannel, fetchChannelInfo } from '@/wksdk/channelManager'
import { messageListModal } from '../messageListModal'
const props = defineProps({
  message: {
    type: Object,
    default: () => ({}),
  },
})
const title = computed(() => {
  return content.value.channelType === ChannelTypeGroup
    ? '群的聊天记录'
    : names.value + '的聊天记录'
})
const content = computed(() => {
  return props.message.content
})
const names = computed(() => {
  return content.value.users.map((user) => user.name).join('、')
})
const msgs = computed(() => {
  let newMsgs = []
  if (content.value.msgs && content.value.msgs.length > 4) {
    newMsgs = content.value.msgs.slice(0, 4)
  } else {
    newMsgs = content.value.msgs
  }
  newMsgs = newMsgs.map((msg) => {
    const channel = newChannel(msg.fromUID)
    const channelInfo = getChannelInfo(channel)
    let name = ''
    if (channelInfo) {
      name = channelInfo.title
    } else {
      fetchChannelInfo(channel)
    }
    return {
      fromUID: msg.fromUID,
      text: msg.content.conversationDigest,
      name,
    }
  })
  return newMsgs
})
const showMessageList = () => {
  console.log(content.value.msgs)

  messageListModal({
    title: title.value,
    messageList: content.value.msgs,
  })
}
</script>

<style lang="less" scoped></style>
