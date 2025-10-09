<template>
  <div class="chat-message-cell">
    <Bubble
      v-if="message.contentType === MessageContentTypeConst.text"
      :item="item"
    />
    <System
      v-if="message.contentType <= 2000 && message.contentType >= 1000"
      :message="message"
    />
  </div>
</template>

<script setup>
import { computed } from 'vue'
// import { WKSDK, Channel, ChannelTypePerson } from 'wukongimjssdk'
import Bubble from './Bubble.vue'
import System from './System.vue'
import { MessageContentTypeConst } from '../../../tsdd/Const'
const props = defineProps({
  item: {
    type: Object,
    required: true,
  },
})
const message = computed(() => props.item.message)
// const channelInfo = WKSDK.shared().channelManager.getChannelInfo(
//   new Channel(props.item.message.fromUID, ChannelTypePerson)
// )

defineOptions({
  name: 'MessageCell',
})
</script>

<style lang="less" scoped>
.chat-message-cell {
  box-sizing: border-box;
  font-size: 14px;
}
</style>
