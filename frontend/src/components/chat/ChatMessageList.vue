<template>
  <div :class="['chat-message-list']">
    <DynamicScroller
      ref="scrollerRef"
      :items="chatMessages"
      :min-item-size="44"
      class="chat-message-wraper"
      key-field="messageID"
      :key="scrollerKey"
      @resize="onResize"
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
import { ref, computed, nextTick, watch, onMounted, onUnmounted } from 'vue'
import { DynamicScroller, DynamicScrollerItem } from 'vue-virtual-scroller'
import 'vue-virtual-scroller/dist/vue-virtual-scroller.css'
import MessageCell from './messageCell/Index.vue'
import { useChatStore, useUserStore } from '../../stores/index'
import Contextmenu from '@/components/base/Contextmenu.vue'
import { scrollControl } from '@/hooks/useScrollControl'
import { copyMessageContent } from '@/wksdk/utils'
import { conversationPicker } from './conversationPicker/index'

const chatStore = useChatStore()
const userStore = useUserStore()
const scrollerRef = ref(null)
const scrollerKey = ref(0) // 用于强制重新渲染 DynamicScroller
const previousMessagesLength = ref(0) // 记录之前的消息数量
const currentChannelKey = ref('') // 记录当前频道
let isAtBottom = false // 是否位于底部
let lastScrollTop = 0 // 记录上次滚动位置

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

  if (Math.abs(scrollTop - lastScrollTop) > 20) {
    isAtBottom = false
  } else {
    isAtBottom = true
  }

  lastScrollTop = scrollTop

  // 滚动到顶部时加载更多
  if (scrollTop === 0 && !noMore.value && !loading.value && !isLoadingMore.value) {
    loadMoreMessages()
  }
}

const onResize = () => {
  scrollToBottom(true)
}

// 加载更多历史消息
const loadMoreMessages = () => {
  if (!chatStore.currentConversation?.channel) {
    return
  }

  isLoadingMore.value = true
  loading.value = true

  // 获取滚动容器
  const scrollContainer = scrollerRef.value?.$el?.querySelector(
    '.vue-recycle-scroller__item-wrapper',
  )?.parentElement

  if (!scrollContainer) {
    loading.value = false
    isLoadingMore.value = false
    return
  }

  // 记录加载前的滚动高度和当前滚动位置
  const oldScrollHeight = scrollContainer.scrollHeight
  const oldScrollTop = scrollContainer.scrollTop
  let lastHeightDiff = 0 // 记录上次的高度差,避免重复调整
  let restoredScrollTop = null // 记录已恢复的位置

  chatStore
    .loadMoreMessages(chatStore.currentConversation.channel, 30)
    .then(({ messages, hasMore }) => {
      if (!hasMore || messages.length === 0) {
        noMore.value = true
        // 没有更多数据时,不改变滚动位置
        return
      }

      // 加载完成后,恢复滚动位置
      if (messages.length > 0) {
        // 使用智能恢复策略,只在高度真正变化时调整
        nextTick(() => {
          // 第一次尝试 - 立即恢复
          restoreScrollPosition()

          // 监听 DynamicScroller 的更新事件,确保虚拟滚动渲染完成
          const checkInterval = setInterval(() => {
            const currentHeightDiff = scrollContainer.scrollHeight - oldScrollHeight

            // 如果高度已经稳定(连续两次检查高度差相同),则停止检查
            if (currentHeightDiff === lastHeightDiff && currentHeightDiff > 0) {
              clearInterval(checkInterval)
              return
            }

            // 如果高度还在变化,调整位置
            if (currentHeightDiff > lastHeightDiff) {
              restoreScrollPosition()
            }

            lastHeightDiff = currentHeightDiff
          }, 30)

          // 最多检查300ms,之后强制停止
          setTimeout(() => {
            clearInterval(checkInterval)
          }, 300)
        })
      }

      function restoreScrollPosition() {
        const newScrollHeight = scrollContainer.scrollHeight
        const heightDiff = newScrollHeight - oldScrollHeight

        if (heightDiff > 0) {
          const targetScrollTop = oldScrollTop + heightDiff

          // 只有当目标位置与当前已恢复的位置不同时才调整
          // 避免重复设置相同的值导致晃动
          if (restoredScrollTop === null || Math.abs(targetScrollTop - restoredScrollTop) > 1) {
            scrollContainer.scrollTop = targetScrollTop
            restoredScrollTop = targetScrollTop
          }
        }
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

const scrollToBottom = (force = false) => {
  if (!isAtBottom && !force) {
    return
  }
  scrollerRef.value.scrollToBottom()
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

      // 重置用户滚动状态
      isAtBottom = true
      lastScrollTop = 0
    }
  },
  { immediate: true },
)

const onContextmenuSelect = (e) => {
  const { key, data } = e
  switch (key) {
    case 'reply':
      chatStore.setReplyMessage(data)
      break
    case 'copy':
      copyMessageContent(data)
      break
    case 'fave':
      break
    case 'forward':
      conversationPicker({
        title: '转发',
        conversationList: chatStore.conversationList,
        multiple: true,
        confirm: (value) => {
          console.log(value)
        },
      })
      break
    case 'select':
      chatStore.addSelectedMessage(data)
      break
  }
}

const onSelectMessage = (e) => {
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

onMounted(() => {
  console.log('onMounted----->')
  scrollControl.registerScrollHandler('chat-message-list', scrollToBottom)
})

onUnmounted(() => {
  scrollControl.unregisterScrollHandler('chat-message-list')
})

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
