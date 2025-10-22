<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <div
    class="checkbox-container"
    :class="{ checked: modelValue, disabled: disabled }"
    @click="handleClick"
  >
    <i class="iconfont icon-message-success text-white"></i>
  </div>
</template>

<script setup>
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:modelValue', 'change'])

const handleClick = () => {
  if (props.disabled) return

  const newValue = !props.modelValue
  emit('update:modelValue', newValue)
  emit('change', newValue)
}
</script>

<style lang="less" scoped>
.checkbox-container {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 2px solid #d1d5db; /* 灰色边框 */
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  background: transparent;
  overflow: hidden;

  &:hover {
    border-color: #9ca3af;
  }

  &.checked {
    background: var(--primary-color);
    border-color: var(--primary-color);

    &:hover {
      opacity: 0.9;
    }
  }

  &.disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }

  i {
    font-size: 12px;
    line-height: 1;
  }
}
</style>
