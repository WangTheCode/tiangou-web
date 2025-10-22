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
          <MessageCell
            :item="item"
            :align="item.position"
            :user-info="userInfo"
            :show-select-message="showSelectMessage"
            :is-selected="!!selectedMessagesByMessageID[item.messageID]"
            @bubbleContextmenu="onBubbleContextmenu"
            @selected="onSelectMessage"
          />
        </DynamicScrollerItem>
      </template>
    </DynamicScroller>
    <Contextmenu
      ref="contextmenuDropdownRef"
      :menu-items="contextmenuItems"
      @select="onContextmenuSelect"
    />
  </div>
</template>

<script setup>
import { ref, computed, nextTick, watch } from 'vue'
import { DynamicScroller, DynamicScrollerItem } from 'vue-virtual-scroller'
import 'vue-virtual-scroller/dist/vue-virtual-scroller.css'
import MessageCell from './messageCell/Index.vue'
import { useChatStore, useUserStore } from '../../stores/index'
import Contextmenu from '@/components/base/Contextmenu.vue'

const chatStore = useChatStore()
const userStore = useUserStore()
const scrollerRef = ref(null)

// 从 store 中获取 userInfo，只需要获取一次
const userInfo = computed(() => userStore.userInfo)
const showSelectMessage = computed(() => chatStore.showSelectMessage)
const selectedMessagesByMessageID = computed(() => chatStore.selectedMessagesByMessageID)

const contextmenuDropdownRef = ref(null)
const contextmenuItems = ref([
  { key: 'reply', label: '回复', icon: 'icon-relay' },
  { key: 'copy', label: '复制', icon: 'icon-copy' },
  { key: 'fave', label: '收藏', icon: 'icon-xin' },
  { key: 'forward', label: '转发', icon: 'icon-share' },
  { key: 'select', label: '多选', icon: 'icon-radio' },
])

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

const onContextmenuSelect = (e) => {
  console.log(111, e)
  const { key, data } = e
  switch (key) {
    case 'reply':
      chatStore.setReplyMessage(data)
      break
    case 'copy':
      break
    case 'fave':
      break
    case 'select':
      chatStore.addSelectedMessage(data)
      break
  }
}

const onSelectMessage = (e) => {
  console.log(333, e)
  const { checked, message } = e
  if (checked) {
    chatStore.addSelectedMessage(message)
  } else {
    chatStore.removeSelectedMessage(message)
  }
}

const onBubbleContextmenu = ({ event, message }) => {
  console.log(222, event, message)
  contextmenuDropdownRef.value?.open(event, message)
}

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
