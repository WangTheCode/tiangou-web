<template>
  <div :class="['chat-bubble', align]">
    <div
      v-if="align == 'left'"
      class="mr-4 min-w-[50px]"
    >
      <Avatar
        v-if="isAvatar"
        :channel="message.channel"
        shape="circle"
      />
    </div>
    <div class="flex-1 pt-[4px]">
      <div class="chat-bubble-content relative">
        <div
          v-if="isAvatar"
          :class="['chat-bubble-content_tail', align]"
        >
          <i
            class="iconfont"
            :class="`icon-bubble-tail-${align}`"
          ></i>
        </div>
        <div class="chat-bubble-content_name">
          {{ message.nickname }}
        </div>
        <!-- eslint-disable vue/no-v-html -->
        <div
          class="chat-bubble-content_text"
          v-html="content"
        ></div>
        <!-- eslint-enable vue/no-v-html -->
        <div class="chat-bubble-content_time">{{ message.created_at }}</div>
      </div>
    </div>
    <div
      v-if="align === 'right'"
      class="ml-4"
    >
      <Avatar
        v-if="isAvatar"
        :channel="message.channel"
        shape="circle"
      />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import Avatar from '../../Avatar.vue'
import { BubblePosition } from '../../../tsdd/Model'
import { WKSDK, Channel, ChannelTypePerson } from 'wukongimjssdk'
import { useUserStore } from '../../../stores'
const userStore = useUserStore()
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
const userInfo = computed(() => userStore.userInfo)
const message = computed(() => props.item.message)
const channelInfo = WKSDK.shared().channelManager.getChannelInfo(
  new Channel(message.value.fromUID, ChannelTypePerson)
)
const align = computed(() => {
  return message.value.send ? 'right' : 'left'
})

const isAvatar = computed(() => {
  return (
    props.item.bubblePosition === BubblePosition.last ||
    props.item.bubblePosition === BubblePosition.single
  )
})
const content = computed(() => {
  if (message.value && message.value.content && message.value.content.text) {
    return message.value.content.text.replace(/\n/g, '<br>')
  }
  return ''
})

defineOptions({
  name: 'MessageBubble',
})

const renderContent = message => {
  if (!(message && message.content && message.content.text)) return ''
  return message.content.text.replace(/\n/g, '<br>')
}
</script>

<style lang="less" scoped>
.chat-bubble {
  display: flex;
  font-size: 12px;
  box-sizing: border-box;

  .chat-bubble-content {
    font-size: 14px;
    padding: 10px;
    display: inline-block;
    border-radius: 6px;
    margin-bottom: 4px;
    word-wrap: break-word;
    word-break: break-all;
    white-space: pre-wrap;
    max-width: calc(100% - 42px);

    .chat-bubble-content_tail {
      position: absolute;
      bottom: -6px;
      left: -18px;
      padding: 0;
      line-height: 1;
      .iconfont {
        font-size: 30px;
        color: #333;
      }
      &.right {
        left: auto;
        right: -18px;
        .iconfont {
          color: var(--primary-color);
        }
      }
    }
    .chat-bubble-content_time {
      color: #999;
    }
  }
  &.left {
    .chat-bubble-content {
      background-color: #333;
      color: #fff;
      border-bottom-left-radius: 0;
    }
  }
  &.right {
    text-align: right;

    .chat-bubble-content {
      background-color: var(--primary-color);
      color: #fff;
      text-align: left;
      border-bottom-right-radius: 0;
      a {
        color: #fff;
      }
    }
  }
}
</style>
