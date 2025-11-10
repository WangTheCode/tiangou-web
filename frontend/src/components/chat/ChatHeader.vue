<template>
  <div class="p-2 border-b border-gray-200">
    <div v-if="channelInfo && channelInfo.channel" class="flex">
      <div class="w-[50px] h-[50px] rounded-lg overflow-hidden">
        <img :src="avatar" alt="" class="w-full h-full object-cover" />
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
import { computed, onMounted, ref, watch } from 'vue'
import { useChatStore } from '@/stores/index'
import { avatarChannel, fetchChannelInfoIfNeed } from '@/wksdk/channelManager'
import IconButton from '../base/IconButton.vue'

const chatStore = useChatStore()
const currentChannel = computed(() => chatStore.currentChannel || {})
const channelInfo = ref({})
const avatar = ref('')

const renderChannelInfo = async () => {
  if (!(currentChannel.value && currentChannel.value.channelID)) {
    return
  }
  channelInfo.value = await fetchChannelInfoIfNeed(currentChannel.value)
  console.log('channelInfo', channelInfo.value)
  avatar.value = avatarChannel(currentChannel.value)
}

watch(currentChannel, () => {
  renderChannelInfo()
})

onMounted(() => {
  renderChannelInfo()
})
</script>

<style lang="less" scoped></style>
