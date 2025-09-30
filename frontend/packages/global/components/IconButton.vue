<template>
  <button
    class="transition-all duration-200 border-none cursor-pointer relative"
    :class="[sizeClass, roundClass, { 'opacity-50 cursor-not-allowed': disabled }]"
    :disabled="disabled"
    @click="handleClick"
  >
    <slot />
    <i
      v-if="icon"
      :class="`iconfont ${icon}`"
    />
  </button>
</template>

<script setup>
import { computed } from 'vue'
const props = defineProps({
  // 尺寸：sm/md/lg
  size: {
    type: String,
    default: 'md',
    validator: value => ['sm', 'md', 'lg'].includes(value),
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
})

const emit = defineEmits(['click'])

// 尺寸类
const sizeClass = computed(() => {
  const sizes = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg',
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
  background-color: transparent;
  color: currentColor;

  &:hover:not(:disabled) {
    background-color: var(--hover-bg-color, #f1f1f1);
  }

  &:active:not(:disabled) {
    transform: scale(0.95);
  }
}
</style>
