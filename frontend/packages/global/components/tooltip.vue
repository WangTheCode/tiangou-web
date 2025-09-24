<template>
  <div class="relative inline-block" ref="tooltipRef">
    <!-- 触发元素 -->
    <div class="cursor-pointer" @click="toggleTooltip" ref="triggerRef">
      <slot></slot>
    </div>

    <!-- Tooltip 内容 -->
    <transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0 scale-95"
      enter-to-class="opacity-100 scale-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-95"
    >
      <div
        v-if="visible"
        :class="[
          'absolute z-50 px-3 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg shadow-sm',
          'max-w-xs whitespace-nowrap',
          positionClasses,
          'before:content-[\'\'] before:absolute before:border-4 before:border-transparent',
          arrowClasses,
        ]"
        ref="tooltipContentRef"
      >
        <slot name="content"></slot>
      </div>
    </transition>

    <!-- 点击外部关闭的遮罩 -->
    <div v-if="visible" class="fixed inset-0 z-40" @click="hideTooltip"></div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  placement: {
    type: String,
    default: 'top',
    validator: (value) => ['top', 'right', 'bottom', 'left'].includes(value),
  },
  trigger: {
    type: String,
    default: 'click',
    validator: (value) => ['click', 'hover'].includes(value),
  },
  offset: {
    type: Number,
    default: 4,
  },
})

const visible = ref(false)
const tooltipRef = ref(null)
const triggerRef = ref(null)
const tooltipContentRef = ref(null)

// 位置样式类
const positionClasses = computed(() => {
  const offset = props.offset
  switch (props.placement) {
    case 'top':
      return `bottom-full left-1/2 transform -translate-x-1/2 mb-${Math.ceil(offset / 4)}`
    case 'bottom':
      return `top-full left-1/2 transform -translate-x-1/2 mt-${Math.ceil(offset / 4)}`
    case 'left':
      return `right-full top-1/2 transform -translate-y-1/2 mr-${Math.ceil(offset / 4)}`
    case 'right':
      return `left-full top-1/2 transform -translate-y-1/2 ml-${Math.ceil(offset / 4)}`
    default:
      return `bottom-full left-1/2 transform -translate-x-1/2 mb-${Math.ceil(offset / 4)}`
  }
})

// 箭头样式类
const arrowClasses = computed(() => {
  switch (props.placement) {
    case 'top':
      return 'before:top-full before:left-1/2 before:-translate-x-1/2 before:border-t-gray-900'
    case 'bottom':
      return 'before:bottom-full before:left-1/2 before:-translate-x-1/2 before:border-b-gray-900'
    case 'left':
      return 'before:left-full before:top-1/2 before:-translate-y-1/2 before:border-l-gray-900'
    case 'right':
      return 'before:right-full before:top-1/2 before:-translate-y-1/2 before:border-r-gray-900'
    default:
      return 'before:top-full before:left-1/2 before:-translate-x-1/2 before:border-t-gray-900'
  }
})

// 切换显示状态
const toggleTooltip = () => {
  visible.value = !visible.value
}

// 显示 tooltip
const showTooltip = () => {
  visible.value = true
}

// 隐藏 tooltip
const hideTooltip = () => {
  visible.value = false
}

// 处理鼠标悬停事件
const handleMouseEnter = () => {
  if (props.trigger === 'hover') {
    showTooltip()
  }
}

const handleMouseLeave = () => {
  if (props.trigger === 'hover') {
    hideTooltip()
  }
}

// 处理键盘事件（ESC 关闭）
const handleKeydown = (event) => {
  if (event.key === 'Escape') {
    hideTooltip()
  }
}

onMounted(() => {
  if (props.trigger === 'hover' && triggerRef.value) {
    triggerRef.value.addEventListener('mouseenter', handleMouseEnter)
    triggerRef.value.addEventListener('mouseleave', handleMouseLeave)
  }

  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  if (props.trigger === 'hover' && triggerRef.value) {
    triggerRef.value.removeEventListener('mouseenter', handleMouseEnter)
    triggerRef.value.removeEventListener('mouseleave', handleMouseLeave)
  }

  document.removeEventListener('keydown', handleKeydown)
})

// 暴露方法给父组件
defineExpose({
  show: showTooltip,
  hide: hideTooltip,
  toggle: toggleTooltip,
})
</script>

<style lang="less" scoped>
/* 自定义样式补充 */
.tooltip-arrow {
  &::before {
    content: '';
    position: absolute;
    border: 4px solid transparent;
  }
}
</style>
