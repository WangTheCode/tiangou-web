<template>
  <div :class="['flex text-xs box-border', { 'text-right': align === 'right' }]">
    <div v-if="showSelectMessage" class="flex items-end pb-1 pr-2">
      <Checkbox v-model="currentSelected" />
    </div>
    <div v-if="align == 'left'" class="mr-4 min-w-[50px] flex items-end">
      <Avatar v-if="isAvatar" :channel="fromChannel" shape="circle" />
    </div>
    <div class="flex-1">
      <div :class="['relative bubble-base', bubbleContentClasses]" @contextmenu="onContextmenu">
        <div v-if="isAvatar" :class="['chat-bubble-content_tail', align]">
          <i class="iconfont" :class="`icon-bubble-tail-${align}`"></i>
        </div>
        <MessageHead
          v-if="
            showMessageHead &&
            align === 'left' &&
            (item.bubblePosition === BubblePosition.first ||
              item.bubblePosition === BubblePosition.single)
          "
          :message="message"
        />
        <!-- eslint-disable vue/no-v-html -->
        <div>
          <slot></slot>
          <MessageTrail v-if="showMessageTrail" :message="message" />
        </div>
      </div>
    </div>
    <div v-if="align === 'right'" class="ml-4 min-w-[50px] flex items-end">
      <Avatar v-if="isAvatar" :channel="userInfo.channel" shape="circle" />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import Avatar from '@/components/base/Avatar.vue'
import Checkbox from '@/components/base/Checkbox.vue'
import { newChannel } from '@/wksdk/channelManager'
import MessageHead from './MessageHead.vue'
import MessageTrail from './MessageTrail.vue'
import { BubblePosition } from '@/wksdk/const'

const props = defineProps({
  item: {
    type: Object,
    required: true,
  },
  userInfo: {
    type: Object,
    required: true,
  },
  showMessageHead: {
    type: Boolean,
    default: true,
  },
  showMessageTrail: {
    type: Boolean,
    default: true,
  },
  isSelected: {
    type: Boolean,
    default: false,
  },
  showSelectMessage: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['contextmenu', 'selected'])

const message = computed(() => props.item.message)

// 使用计算属性的 getter/setter 来管理选中状态
const currentSelected = computed({
  get() {
    // 确保返回布尔值，防止传入对象或 undefined
    return !!props.isSelected
  },
  set(value) {
    emit('selected', {
      checked: value,
    })
  },
})
const fromChannel = computed(() => {
  return newChannel(props.item.message.fromUID)
})

const align = computed(() => {
  return message.value.send ? 'right' : 'left'
})

const isAvatar = computed(() => {
  return (
    props.item.bubblePosition === BubblePosition.last ||
    props.item.bubblePosition === BubblePosition.single
  )
})

// 气泡内容的样式类
const bubbleContentClasses = computed(() => {
  const classes = [
    'text-sm',
    'inline-block',
    'rounded-[10px]',
    'break-words',
    'break-all',
    'whitespace-pre-wrap',
    'max-w-[calc(100%-42px)]',
  ]

  if (align.value === 'left') {
    classes.push('bg-[#515151]', 'text-white')
    if (isAvatar.value) {
      classes.push('rounded-bl-none')
    }
  } else {
    classes.push('bg-primary', 'text-white', 'text-left')
    if (isAvatar.value) {
      classes.push('rounded-br-none')
    }
  }

  return classes
})

defineOptions({
  name: 'MessageBubble',
})

const onContextmenu = (event) => {
  event.preventDefault()
  emit('contextmenu', {
    event,
    message: props.item.message,
  })
}
</script>

<style lang="less" scoped>
// 气泡尾巴样式（无法用 Tailwind 实现的伪元素和特殊选择器）
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

// 链接颜色
:deep(a) {
  color: #fff;
}
</style>
