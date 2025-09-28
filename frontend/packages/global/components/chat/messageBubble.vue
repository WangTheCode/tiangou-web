<template>
    <div :class="['flex text-[12px] mb-5 min-h-[76px] box-border', item.role === 'user' ? 'text-right' : 'text-left']">
      <div v-if="item.role !== 'user'" class="mr-2.5">
        <a-avatar v-if="item.avatar" :src="item.avatar" />
        <a-avatar v-else src="/images/ai.png" />
      </div>
      <div class="flex-1 pt-1">
        <div class="mb-[5px]">
          {{ item.nickname ? item.nickname : item.username }}
        </div>
        <div
          :class="[
            'text-sm p-2.5 inline-block rounded-[6px] mb-1 break-words break-all whitespace-pre-wrap max-w-[calc(100%-42px)]',
            item.role === 'user' ? 'bg-[var(--primary-color)] text-white text-left' : 'bg-white text-[#333]'
          ]"
          v-html="renderContent(item)"
        ></div>
        <div class="text-[#999]">{{ item.created_at }}</div>
      </div>
      <div v-if="item.role === 'user'" class="ml-2.5">
        <a-avatar v-if="item.avatar" :src="item.avatar" />
        <a-avatar v-else src="/images/avatar.png" />
      </div>
    </div>
  </template>
  
  <script setup>
  defineProps({
    item: {
      type: Object,
      required: true,
    },
  })
  defineOptions({
    name: 'ChatBubble',
  })
  
  const renderContent = (item) => {
    if (!item.content) return ''
  
    return item.content.replace(/\n/g, '<br>')
  }
  </script>
  
  