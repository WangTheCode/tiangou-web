<template>
  <div class="p-2 border-b border-gray-200">
    <div v-if="currentChannelInfo && currentChannelInfo.channel" class="flex">
      <!-- <div class="w-[50px] h-[50px] rounded-lg overflow-hidden">
        <img :src="avatar" alt="" class="w-full h-full object-cover" />
      </div> -->
      <Avatar :src="getImageURL(currentChannelInfo.logo)" shape="circle" :size="40" />
      <div class="flex-1 flex pl-3">
        <h3 class="leading-[40px] mr-4">{{ currentChannelInfo.orgData.displayName }}</h3>
        <!-- <div class="text-sm leading-30">
            <a-badge v-if="wsStatus == 'success'" status="success" text="在线" />
            <a-badge v-else-if="wsStatus == 'loading'" status="processing" text="连接中" />
            <a-badge v-else status="error" text="离线" />
          </div> -->
      </div>

      <div>
        <IconButton round @click="handleOpenChannelSetting">
          <i class="iconfont icon-menu-dot" />
        </IconButton>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useChatStore } from '@/stores/index'
import { getImageURL } from '@/wksdk/channelManager'
import IconButton from '../base/IconButton.vue'
import Avatar from '@/components/base/Avatar.vue'
import { friendSettingSettingDrawer, groupSettingSettingDrawer } from './channelSetting/index'
import { ChannelTypePerson, ChannelTypeGroup } from 'wukongimjssdk'

const chatStore = useChatStore()
const currentChannelInfo = computed(() => chatStore.currentChannelInfo || {})

const handleOpenChannelSetting = () => {
  if (
    currentChannelInfo.value.channel &&
    currentChannelInfo.value.channel.channelType === ChannelTypePerson
  ) {
    friendSettingSettingDrawer({})
  } else if (
    currentChannelInfo.value.channel &&
    currentChannelInfo.value.channel.channelType === ChannelTypeGroup
  ) {
    groupSettingSettingDrawer({})
  }
}
</script>

<style lang="less" scoped></style>
