<template>
  <div class="chat-message-cell">
    <Bubble
      v-if="message.contentType === MessageContentTypeConst.text"
      :item="item"
      :user-info="userInfo"
      :show-select-message="showSelectMessage"
      :is-selected="isSelected"
      @contextmenu="onBubbleContextmenu"
      @selected="onSelectMessage"
    >
      <span v-html="textContent"></span>
    </Bubble>

    <TimeLine v-else-if="message.contentType === MessageContentTypeConst.time" :message="message" />
    <HistorySplit v-else-if="message.contentType === MessageContentTypeConst.historySplit" />
    <System
      v-else-if="message.contentType <= 2000 && message.contentType >= 1000"
      :message="message"
    />
    <Bubble
      v-else
      :item="item"
      :user-info="userInfo"
      :show-select-message="showSelectMessage"
      :is-selected="isSelected"
      :show-message-trail="false"
      @contextmenu="onBubbleContextmenu"
      @selected="onSelectMessage"
    >
      <MessageImage
        v-if="message.contentType === MessageContentTypeConst.image"
        :message="message"
      />
      <MessageFile
        v-else-if="message.contentType === MessageContentTypeConst.file"
        :message="message"
      />
      <MessageSmallVideo
        v-else-if="message.contentType === MessageContentTypeConst.smallVideo"
        :message="message"
      />
      <MergeForward
        v-else-if="message.contentType === MessageContentTypeConst.mergeForward"
        :message="message"
      />
    </Bubble>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { MessageContentTypeConst } from '@/wksdk/const'
import Bubble from './Bubble.vue'
import System from './System.vue'
import TimeLine from './TimeLine.vue'
import MergeForward from './MergeForward.vue'
import MessageImage from './MessageImage.vue'
import MessageFile from './MessageFile.vue'
import MessageSmallVideo from './MessageSmallVideo.vue'
import HistorySplit from './HistorySplit.vue'

// import { imageScale } from '@/wksdk/utils'
const props = defineProps({
  item: {
    type: Object,
    required: true,
  },
  userInfo: {
    type: Object,
    required: true,
  },
  showSelectMessage: {
    type: Boolean,
    default: false,
  },
  isSelected: {
    type: Boolean,
    default: false,
  },
})
const message = computed(() => props.item.message)

const textContent = computed(() => {
  if (message.value && message.value.content && message.value.content.text) {
    return message.value.content.text.replace(/\n/g, '<br>')
  }
  return ''
})

const emit = defineEmits(['bubbleContextmenu', 'selected'])
const onBubbleContextmenu = (event) => {
  emit('bubbleContextmenu', event)
}

const onSelectMessage = (e) => {
  emit('selected', {
    checked: e.checked,
    message: props.item,
  })
}
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
