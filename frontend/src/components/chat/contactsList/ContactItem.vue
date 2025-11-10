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
      <img :src="item.avatar" alt="" class="w-full h-full object-cover" />
    </div>
    <div class="flex-1 pl-3">
      <div class="flex leading-8 items-center">
        <div class="font-bold flex flex-1 min-w-0">
          <h4 class="truncate">{{ item.name }}</h4>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
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
