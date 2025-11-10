<template>
  <div
    class="flex p-3 cursor-pointer rounded-md"
    :class="{
      'bg-[var(--primary-color)] text-white': isCurrent,
      'hover:bg-[#f0f0f0]': !isCurrent,
    }"
    @click="handleClick"
  >
    <div class="w-[50px] h-[50px] rounded-lg overflow-hidden">
      <!-- <img :src="item.avatar" alt="" class="w-full h-full object-cover" /> -->
      <Avatar :src="item.avatar" shape="circle" />
    </div>
    <div class="flex-1 pl-3">
      <div class="flex items-center leading-[50px]">
        {{ item.name }}
      </div>
    </div>
  </div>
</template>

<script setup>
import Avatar from '@/components/base/Avatar.vue'
const props = defineProps({
  item: {
    type: Object,
    required: true,
  },
  isCurrent: {
    type: Boolean,
    required: false,
  },
})

const emit = defineEmits(['click'])

const handleClick = () => {
  emit('click', props.item)
}
</script>

<style lang="less" scoped></style>
