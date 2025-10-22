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
    <Bubble
      v-else-if="message.contentType === MessageContentTypeConst.image"
      :item="item"
      :user-info="userInfo"
      :show-select-message="showSelectMessage"
      :is-selected="isSelected"
      :show-message-trail="false"
      @contextmenu="onBubbleContextmenu"
      @selected="onSelectMessage"
    >
      <img
        :src="imageData.url"
        :style="{ width: imageData.width, height: imageData.height }"
        decoding="sync"
      />
    </Bubble>
    <TimeLine v-else-if="message.contentType === MessageContentTypeConst.time" :message="message" />
    <System
      v-else-if="message.contentType <= 2000 && message.contentType >= 1000"
      :message="message"
    />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { MessageContentTypeConst } from '@/wksdk/const'
import Bubble from './Bubble.vue'
import System from './System.vue'
import TimeLine from './TimeLine.vue'
import { imageScale } from '@/wksdk/utils'
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
const imageData = computed(() => {
  if (message.value && message.value.content && message.value.content.url) {
    let scaleSize = imageScale(message.value.content.width, message.value.content.height)
    return {
      url: message.value.content.url,
      width: scaleSize.width + 'px',
      height: scaleSize.height + 'px',
    }
  }
  return {}
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
