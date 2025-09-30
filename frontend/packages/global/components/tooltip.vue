<template>
  <div
    ref="tooltipRef"
    class="relative inline-block"
  >
    <!-- 触发元素 -->
    <div
      ref="triggerRef"
      class="cursor-pointer"
      @click="toggleTooltip"
    >
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
        ref="tooltipContentRef"
        :class="[
          'absolute z-50 px-3 py-2 text-sm font-medium rounded-md',
          'shadow-lg',
          'max-w-xs whitespace-nowrap',
          positionClasses,
          themeClasses,
          'before:content-[\'\'] before:absolute before:border-[9px] before:border-transparent',
          'after:content-[\'\'] after:absolute after:border-[8px] after:border-transparent',
          arrowClasses,
        ]"
      >
        <slot name="content"></slot>
      </div>
    </transition>

    <!-- 点击外部关闭的遮罩 -->
    <div
      v-if="visible"
      class="fixed inset-0 z-40"
      @click="hideTooltip"
    ></div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  placement: {
    type: String,
    default: 'top',
    validator: value => ['top', 'right', 'bottom', 'left'].includes(value),
  },
  trigger: {
    type: String,
    default: 'click',
    validator: value => ['click', 'hover'].includes(value),
  },
  offset: {
    type: Number,
    default: 4,
  },
  theme: {
    type: String,
    default: 'light',
    validator: value => ['light', 'dark'].includes(value),
  },
  border: {
    type: Boolean,
    default: true,
  },
})

const visible = ref(false)
const tooltipRef = ref(null)
const triggerRef = ref(null)
const tooltipContentRef = ref(null)

// 主题样式类
const themeClasses = computed(() => {
  if (props.theme === 'dark') {
    return 'bg-gray-900 text-white border border-gray-700'
  }
  return 'bg-white text-gray-900 border border-gray-200'
})

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

// 箭头样式类（双层箭头：before=边框，after=填充）
const arrowClasses = computed(() => {
  const isDark = props.theme === 'dark'

  const arrows = {
    top: isDark
      ? 'before:top-full before:left-1/2 before:-translate-x-1/2 before:border-t-gray-700 after:top-full after:left-1/2 after:-translate-x-1/2 after:border-t-gray-900 after:-mt-px'
      : 'before:top-full before:left-1/2 before:-translate-x-1/2 before:border-t-gray-200 after:top-full after:left-1/2 after:-translate-x-1/2 after:border-t-white after:-mt-px',
    bottom: isDark
      ? 'before:bottom-full before:left-1/2 before:-translate-x-1/2 before:border-b-gray-700 after:bottom-full after:left-1/2 after:-translate-x-1/2 after:border-b-gray-900 after:-mb-px'
      : 'before:bottom-full before:left-1/2 before:-translate-x-1/2 before:border-b-gray-200 after:bottom-full after:left-1/2 after:-translate-x-1/2 after:border-b-white after:-mb-px',
    left: isDark
      ? 'before:left-full before:top-1/2 before:-translate-y-1/2 before:border-l-gray-700 after:left-full after:top-1/2 after:-translate-y-1/2 after:border-l-gray-900 after:-ml-px'
      : 'before:left-full before:top-1/2 before:-translate-y-1/2 before:border-l-gray-200 after:left-full after:top-1/2 after:-translate-y-1/2 after:border-l-white after:-ml-px',
    right: isDark
      ? 'before:right-full before:top-1/2 before:-translate-y-1/2 before:border-r-gray-700 after:right-full after:top-1/2 after:-translate-y-1/2 after:border-r-gray-900 after:-mr-px'
      : 'before:right-full before:top-1/2 before:-translate-y-1/2 before:border-r-gray-200 after:right-full after:top-1/2 after:-translate-y-1/2 after:border-r-white after:-mr-px',
  }

  return arrows[props.placement] || arrows.top
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
const handleKeydown = event => {
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
