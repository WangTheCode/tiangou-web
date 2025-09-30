<template>
  <button
    class="transition-all duration-100 inline-block box-border py-2 px-4 outline outline-1 outline-transparent rounded-md border-transparent text-sm font-semibold bg-blue-500 text-white cursor-pointer gap-2 relative"
    style="overflow: unset"
    :disabled="disabled"
    :class="{ 'opacity-50': disabled }"
    @click="handleClick"
  >
    <slot />
  </button>
</template>

<script setup>
const props = defineProps({
  color: {
    type: String,
    default: '',
  },
  disabled: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['click'])

const handleClick = () => {
  if (props.disabled) return
  emit('click')
}
</script>

<style lang="less" scoped></style>
