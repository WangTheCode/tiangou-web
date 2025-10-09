<template>
  <div :class="['chat-bubble', align]">
    <div
      v-if="align == 'left' && isAvatar"
      class="chat-bubble-avatar"
    >
      <Avatar :channel="item.channel" />
    </div>
    <div class="chat-bubble-content">
      <div class="chat-bubble-content_name">
        {{ item.nickname }}
      </div>
      <!-- eslint-disable vue/no-v-html -->
      <div
        class="chat-bubble-content_text"
        v-html="renderContent(item.message)"
      ></div>
      <!-- eslint-enable vue/no-v-html -->
      <div class="chat-bubble-content_time">{{ item.created_at }}</div>
    </div>
    <div
      v-if="align === 'right'"
      class="chat-bubble-avatar"
    >
      <Avatar :channel="item.channel" />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import Avatar from '../Avatar.vue'
import { BubblePosition } from '../../tsdd/Model'
import { WKSDK, Channel, ChannelTypePerson } from 'wukongimjssdk'
const props = defineProps({
  item: {
    type: Object,
    required: true,
  },
  // align: {
  //   type: String,
  //   default: 'left',
  //   validator: value => ['left', 'right'].includes(value),
  // },
})
const message = props.item.message
const channelInfo = WKSDK.shared().channelManager.getChannelInfo(
  new Channel(props.item.message.fromUID, ChannelTypePerson)
)
const align = computed(() => {
  return message.send ? 'right' : 'left'
})

const isAvatar = computed(() => {
  return (
    (message.bubblePosition === BubblePosition.last ||
      message.bubblePosition === BubblePosition.single) &&
    channelInfo
  )
})

defineOptions({
  name: 'ChatBubble',
})

console.log(333, channelInfo)

const renderContent = message => {
  if (!(message && message.content && message.content.text)) return ''
  return message.content.text.replace(/\n/g, '<br>')
}
</script>

<style lang="less" scoped>
.chat-bubble {
  display: flex;
  font-size: 12px;
  margin-bottom: 20px;
  min-height: 76px;
  box-sizing: border-box;

  .chat-bubble-content {
    flex: 1;
    padding-top: 4px;
    .chat-bubble-content_name {
      margin-bottom: 5px;
    }
    .chat-bubble-content_text {
      font-size: 14px;
      padding: 10px;
      display: inline-block;
      border-radius: 6px;
      margin-bottom: 4px;
      word-wrap: break-word;
      word-break: break-all;
      white-space: pre-wrap;
      max-width: calc(100% - 42px);
    }
    .chat-bubble-content_time {
      color: #999;
    }
  }
  &.left {
    .chat-bubble-avatar {
      margin-right: 10px;
    }
    .chat-bubble-content_text {
      background-color: #fff;
      color: #333;
    }
  }
  &.right {
    text-align: right;
    .chat-bubble-avatar {
      margin-left: 10px;
    }
    .chat-bubble-content_text {
      background-color: var(--primary-color);
      color: #fff;
      text-align: left;
      a {
        color: #fff;
      }
    }
  }
}
</style>
