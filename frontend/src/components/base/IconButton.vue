<template>
  <button
    class="transition-all duration-200 border-none cursor-pointer relative"
    :class="[sizeClass, roundClass, { 'opacity-50 cursor-not-allowed': disabled }]"
    :style="{ '--bg-color': bgColor, '--hover-bg-color': hoverBgColor }"
    :disabled="disabled"
    @click="handleClick"
  >
    <slot />
    <i v-if="icon" :class="`iconfont ${icon}`" :style="{ fontSize: iconSize }" />
  </button>
</template>

<script setup>
import { computed } from 'vue'
const props = defineProps({
  // 尺寸：sm/md/lg
  size: {
    type: String,
    default: 'md',
    validator: (value) => ['sm', 'md', 'lg'].includes(value),
  },
  icon: {
    type: String,
    default: '',
  },
  // 是否圆形
  round: {
    type: Boolean,
    default: false,
  },
  // 是否禁用
  disabled: {
    type: Boolean,
    default: false,
  },
  iconSize: {
    type: String,
    default: '16px',
  },
  bgColor: {
    type: String,
    default: 'transparent',
  },
  hoverBgColor: {
    type: String,
    default: '#f1f1f1',
  },
})

const emit = defineEmits(['click'])

// 尺寸类
const sizeClass = computed(() => {
  const sizes = {
    sm: 'w-8 h-8 text-sm leading-8',
    md: 'w-10 h-10 text-base leading-10',
    lg: 'w-12 h-12 text-lg leading-12',
  }
  return sizes[props.size]
})

// 圆角类
const roundClass = computed(() => {
  return props.round ? 'rounded-full' : 'rounded-md'
})

const handleClick = () => {
  if (props.disabled) return
  emit('click')
}
</script>

<style lang="less" scoped>
button {
  background-color: var(--bg-color, transparent);
  color: currentColor;

  &:hover:not(:disabled) {
    background-color: var(--hover-bg-color, #f1f1f1);
  }

  &:active:not(:disabled) {
    transform: scale(0.95);
  }
}
</style>
