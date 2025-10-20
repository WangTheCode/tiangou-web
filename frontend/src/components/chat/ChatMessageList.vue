<template>
  <div :class="['chat-message-list']">
    <DynamicScroller
      ref="scrollerRef"
      :items="chatMessages"
      :min-item-size="44"
      class="chat-message-wraper"
      key-field="messageID"
      @resize="scrollToBottom()"
      @scroll="onScroll"
    >
      <template #before>
        <div v-if="loading" class="loading-more">加载中...</div>
        <div v-else-if="noMore" class="no-more">没有更多消息了</div>
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
          <MessageCell :item="item" :align="item.position" />
        </DynamicScrollerItem>
      </template>
    </DynamicScroller>
  </div>
</template>

<script setup>
import { ref, computed, nextTick, watch } from 'vue'
import { DynamicScroller, DynamicScrollerItem } from 'vue-virtual-scroller'
import 'vue-virtual-scroller/dist/vue-virtual-scroller.css'
import MessageCell from './messageCell/Index.vue'
import { useChatStore } from '../../stores/index'

const chatStore = useChatStore()
const scrollerRef = ref(null)

const chatMessages = computed(() => {
  if (chatStore.chatMessages) {
    return chatStore.chatMessages
  }
  return []
})
const loading = ref(false)
const noMore = ref(false)

const onScroll = (e) => {
  const { scrollTop } = e.target
  if (scrollTop === 0 && !noMore.value) {
    // getChatMessages(true).then(() => {
    //   // console.log(e.target, e.target.scrollHeight, e.target.scrollTop)
    //   // e.target.scrollTo(0, scrollHeight.value - 30)
    // })
  }
}

const scrollToBottom = () => {
  nextTick(() => {
    console.log('scrollToBottom')

    if (scrollerRef.value) {
      // 方法1: 使用 DynamicScroller 的 scrollToBottom 方法
      if (typeof scrollerRef.value.scrollToBottom === 'function') {
        scrollerRef.value.scrollToBottom()
      } else if (scrollerRef.value.$el) {
        // 方法2: 直接操作 DOM 元素
        const scrollContainer = scrollerRef.value.$el.querySelector(
          '.vue-recycle-scroller__item-wrapper',
        )?.parentElement
        if (scrollContainer) {
          scrollContainer.scrollTop = scrollContainer.scrollHeight
        }
      }
    }
  })
}

// 监听消息列表变化，自动滚动到底部
watch(
  chatMessages,
  (newMessages) => {
    if (newMessages && newMessages.length > 0) {
      scrollToBottom()
    }
  },
  { deep: true },
)

// 暴露方法给父组件
defineExpose({
  scrollToBottom,
})
</script>

<style lang="less" scoped>
.chat-message-list {
  // padding: 10px;
  flex: auto 1 1;

  overflow: hidden;
  // overflow-y: auto;
  position: relative;
  // height: 700px;
  background: url(/svg/chat_bg.svg) rgb(245, 247, 249);

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
}
</style>
