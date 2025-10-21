<template>
  <div :class="['chat-bubble', align, { 'is-avatar': isAvatar }]">
    <div v-if="align == 'left'" class="mr-4 min-w-[50px]">
      <Avatar v-if="isAvatar" :channel="fromChannel" shape="circle" />
    </div>
    <div class="flex-1">
      <div class="chat-bubble-content relative bubble-base" @contextmenu="onContextmenu">
        <div v-if="isAvatar" :class="['chat-bubble-content_tail', align]">
          <i class="iconfont" :class="`icon-bubble-tail-${align}`"></i>
        </div>
        <MessageHead
          v-if="
            align === 'left' &&
            (item.bubblePosition === BubblePosition.first ||
              item.bubblePosition === BubblePosition.single)
          "
          :message="message"
        />
        <!-- eslint-disable vue/no-v-html -->
        <div class="chat-bubble-content_text">
          <span v-html="content"></span>
          <MessageTrail :message="message" />
        </div>
        <!-- eslint-enable vue/no-v-html -->
      </div>
    </div>
    <div v-if="align === 'right'" class="ml-4 min-w-[50px]">
      <Avatar v-if="isAvatar" :channel="userInfo.channel" shape="circle" />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import Avatar from '@/components/base/Avatar.vue'
import { newChannel } from '@/wksdk/channelManager'
import { useUserStore } from '@/stores'
import MessageHead from './MessageHead.vue'
import MessageTrail from './MessageTrail.vue'
import { BubblePosition } from '@/wksdk/const'
import { avatarChannel } from '@/wksdk/channelManager'

const userStore = useUserStore()
const props = defineProps({
  item: {
    type: Object,
    required: true,
  },
})
const emit = defineEmits(['contextmenu'])
const userInfo = computed(() => userStore.userInfo)
const message = computed(() => props.item.message)

const fromChannel = computed(() => {
  return newChannel(props.item.message.fromUID)
})
// const avatarUrl = computed(() => {
//   return avatarChannel(newChannel(props.item.message.fromUID))
// })

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

const renderContent = (message) => {
  if (!(message && message.content && message.content.text)) return ''
  return message.content.text.replace(/\n/g, '<br>')
}

const onContextmenu = (event) => {
  event.preventDefault()
  emit('contextmenu', {
    event,
    message: props.item.message,
  })
}
</script>

<style lang="less" scoped>
.chat-bubble {
  display: flex;
  font-size: 12px;
  box-sizing: border-box;

  .chat-bubble-content {
    font-size: 14px;
    display: inline-block;
    border-radius: 10px;
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
        color: #515151;
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
      background-color: #515151;
      color: #fff;
    }
    &.is-avatar {
      .chat-bubble-content {
        border-bottom-left-radius: 0;
      }
    }
  }
  &.right {
    text-align: right;

    .chat-bubble-content {
      background-color: var(--primary-color);
      color: #fff;
      text-align: left;
      a {
        color: #fff;
      }
    }
    &.is-avatar {
      .chat-bubble-content {
        border-bottom-right-radius: 0;
      }
    }
  }
}
</style>
