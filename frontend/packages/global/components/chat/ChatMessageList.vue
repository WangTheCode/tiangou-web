<template>
  <div :class="['chat-message-list']">
    <DynamicScroller
      ref="scrollerRef"
      :items="chatMessages"
      :min-item-size="76"
      class="chat-message-wraper"
      key-field="messageID"
      @resize="scrollToBottom()"
      @scroll="onScroll"
    >
      <template #before>
        <div
          v-if="loading"
          class="loading-more"
        >
          加载中...
        </div>
        <div
          v-else-if="noMore"
          class="no-more"
        >
          没有更多消息了
        </div>
      </template>
      <template #default="{ item, index, active }">
        <DynamicScrollerItem
          :item="item"
          :active="active"
          :size-dependencies="[item.content]"
          :data-index="index"
          :data-active="active"
          :class="['chat-message', item.position]"
        >
          <MessageCell
            :item="item"
            :align="item.position"
          />
        </DynamicScrollerItem>
      </template>
    </DynamicScroller>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { DynamicScroller, DynamicScrollerItem } from 'vue-virtual-scroller'
import 'vue-virtual-scroller/dist/vue-virtual-scroller.css'
import ChatBubble from './ChatBubble.vue'
import MessageCell from './messageCell/Index.vue'
import { useChatStore } from '../../stores/index'

const chatStore = useChatStore()
// const chatMessages = ref([
//   {
//     id: 1,
//     content: 'Hello, world!',
//     position: 'left',
//   },
//   {
//     id: 2,
//     content: 'Hello, world!',
//     position: 'right',
//   },
// ])
const chatMessages = computed(() => {
  if (
    chatStore.chatMessagesByChannelId &&
    chatStore.currentConversation &&
    chatStore.currentConversation.channel &&
    chatStore.currentConversation.channel.channelID &&
    chatStore.chatMessagesByChannelId[chatStore.currentConversation.channel.channelID]
  ) {
    console.log(chatStore.chatMessagesByChannelId[chatStore.currentConversation.channel.channelID])
    return chatStore.chatMessagesByChannelId[chatStore.currentConversation.channel.channelID]
  }
  return []
})
const loading = ref(false)
const noMore = ref(false)

const onScroll = e => {
  const { scrollTop } = e.target
  if (scrollTop === 0 && !noMore.value) {
    // getChatMessages(true).then(() => {
    //   // console.log(e.target, e.target.scrollHeight, e.target.scrollTop)
    //   // e.target.scrollTo(0, scrollHeight.value - 30)
    // })
  }
}

const scrollToBottom = () => {}
</script>

<style lang="less" scoped>
.chat-message-list {
  // padding: 10px;
  flex: auto 1 1;

  overflow: hidden;
  // overflow-y: auto;
  position: relative;
  // height: 700px;

  .loading-more,
  .no-more {
    text-align: center;
    color: #999;
    font-size: 12px;
    padding: 10px 0;
  }
  .chat-message-wraper {
    overflow-y: auto;
    height: 100%;
    padding: 10px;
    // height: 600px;
  }
  // .chat-message {
  //   margin-bottom: 20px;
  //   min-height: 76px;
  //   box-sizing: border-box;
  // }

  // .chat-message {
  //   display: flex;
  //   font-size: 12px;
  //   margin-bottom: 20px;
  //   min-height: 76px;
  //   box-sizing: border-box;

  //   .chat-message-content {
  //     flex: 1;
  //     padding-top: 4px;
  //     .chat-message-content_name {
  //       margin-bottom: 5px;
  //     }
  //     .chat-message-content_text {
  //       font-size: 14px;
  //       padding: 10px;
  //       display: inline-block;
  //       border-radius: 6px;
  //       margin-bottom: 4px;
  //       word-wrap: break-word;
  //       word-break: break-all;
  //       white-space: pre-wrap;
  //       max-width: calc(100% - 42px);
  //     }
  //     .chat-message-content_time {
  //       color: #999;
  //     }
  //   }
  //   &.left {
  //     .chat-message-avatar {
  //       margin-right: 10px;
  //     }
  //     .chat-message-content_text {
  //       background-color: #fff;
  //       color: #333;
  //     }
  //   }
  //   &.right {
  //     text-align: right;
  //     .chat-message-avatar {
  //       margin-left: 10px;
  //     }
  //     .chat-message-content_text {
  //       background-color: var(--primary);
  //       color: #fff;
  //       text-align: left;
  //       a {
  //         color: #fff;
  //       }
  //     }
  //   }
  // }
}
</style>
