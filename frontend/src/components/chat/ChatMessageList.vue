<template>
  <div :class="['chat-message-list']">
    <DynamicScroller
      ref="scrollerRef"
      :items="chatMessages"
      :min-item-size="44"
      class="chat-message-wraper"
      key-field="messageID"
      :key="scrollerKey"
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
const scrollerKey = ref(0) // 用于强制重新渲染 DynamicScroller
const previousMessagesLength = ref(0) // 记录之前的消息数量
const currentChannelKey = ref('') // 记录当前频道

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
const isLoadingMore = ref(false) // 防止重复加载

const onScroll = (e) => {
  const { scrollTop } = e.target
  // 滚动到顶部时加载更多
  if (scrollTop === 0 && !noMore.value && !loading.value && !isLoadingMore.value) {
    loadMoreMessages()
  }
}

// 加载更多历史消息
const loadMoreMessages = () => {
  if (!chatStore.currentConversation?.channel) {
    return
  }

  isLoadingMore.value = true
  loading.value = true

  // 记录当前第一条消息的 ID,用于加载后恢复滚动位置
  const firstMessageID = chatMessages.value[0]?.messageID
  const scrollContainer = scrollerRef.value?.$el?.querySelector(
    '.vue-recycle-scroller__item-wrapper',
  )?.parentElement

  chatStore
    .loadMoreMessages(chatStore.currentConversation.channel, 30)
    .then(({ messages, hasMore }) => {
      if (!hasMore || messages.length === 0) {
        noMore.value = true
      }

      // 加载完成后,恢复滚动位置
      if (messages.length > 0 && scrollContainer && firstMessageID) {
        nextTick(() => {
          // 找到之前第一条消息的元素
          const firstMessageElement = scrollContainer.querySelector(
            `[data-index]`,
          )
          if (firstMessageElement) {
            // 滚动到之前的第一条消息位置
            setTimeout(() => {
              const newScrollTop = messages.length * 44 // 粗略估算高度
              scrollContainer.scrollTop = newScrollTop
            }, 50)
          }
        })
      }
    })
    .catch((err) => {
      console.error('加载历史消息失败:', err)
    })
    .finally(() => {
      loading.value = false
      isLoadingMore.value = false
    })
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

// 监听当前会话变化，重置滚动器
watch(
  () => chatStore.currentConversation?.channel?.getChannelKey?.(),
  (newChannelKey) => {
    if (newChannelKey && newChannelKey !== currentChannelKey.value) {
      // 切换联系人时，强制重新渲染滚动器
      currentChannelKey.value = newChannelKey
      scrollerKey.value++
      previousMessagesLength.value = 0

      // 重置加载状态
      noMore.value = false
      loading.value = false
      isLoadingMore.value = false

      // 等待 DOM 更新后滚动到底部
      nextTick(() => {
        setTimeout(() => scrollToBottom(), 100)
      })
    }
  },
  { immediate: true },
)

// 监听消息列表变化，智能滚动
watch(
  chatMessages,
  (newMessages, oldMessages) => {
    if (!newMessages || newMessages.length === 0) {
      previousMessagesLength.value = 0
      return
    }

    const newLength = newMessages.length
    const oldLength = oldMessages?.length || 0

    // 场景1: 新消息到达 (消息数量增加)
    if (newLength > oldLength && oldLength > 0) {
      const isAtBottom = checkIfAtBottom()
      // 只有当用户已经在底部时才自动滚动
      if (isAtBottom) {
        nextTick(() => scrollToBottom())
      }
    }
    // 场景2: 初次加载消息 (从0到有消息)
    else if (oldLength === 0 && newLength > 0) {
      nextTick(() => {
        setTimeout(() => scrollToBottom(), 100)
      })
    }

    previousMessagesLength.value = newLength
  },
)

// 检查是否在底部
const checkIfAtBottom = () => {
  if (!scrollerRef.value?.$el) return true

  const scrollContainer = scrollerRef.value.$el.querySelector(
    '.vue-recycle-scroller__item-wrapper',
  )?.parentElement

  if (!scrollContainer) return true

  const { scrollTop, scrollHeight, clientHeight } = scrollContainer
  // 允许50px的误差范围
  return scrollHeight - scrollTop - clientHeight < 50
}

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
