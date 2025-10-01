<template>
  <div class="p-2 border-b border-gray-200">
    <div
      v-if="channelInfo && channelInfo.channel"
      class="flex"
    >
      <div class="w-[50px] h-[50px] rounded-lg overflow-hidden">
        <img
          :src="avatar"
          alt=""
          class="w-full h-full object-cover"
        />
      </div>
      <div class="flex-1 flex pl-3">
        <h3 class="leading-[50px] mr-4">{{ channelInfo.orgData.displayName }}</h3>
        <!-- <div class="text-sm leading-30">
            <a-badge v-if="wsStatus == 'success'" status="success" text="在线" />
            <a-badge v-else-if="wsStatus == 'loading'" status="processing" text="连接中" />
            <a-badge v-else status="error" text="离线" />
          </div> -->
      </div>

      <div>
        <IconButton round>
          <i class="iconfont icon-sound-on" />
        </IconButton>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useChatStore } from '../../stores/index'
import { avatarChannel } from '../../tsdd/index'
import IconButton from '../iconButton.vue'
const chatStore = useChatStore()
const currentConversation = computed(() => chatStore.currentConversation || {})
const channelInfo = computed(() => currentConversation.value.channelInfo || {})
const avatar = computed(() => avatarChannel(channelInfo.value.channel))
</script>

<style lang="less" scoped></style>
