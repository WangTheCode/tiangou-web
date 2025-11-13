<template>
  <div class="p-2 border-b border-gray-200">
    <div v-if="currentChannelInfo && currentChannelInfo.channel" class="flex">
      <div class="flex-1 flex" @click="onOpenChannelInfo">
        <Avatar :src="getImageURL(currentChannelInfo.logo)" shape="circle" :size="40" />
        <div class="pl-3">
          <h3 class="leading-[40px] mr-4">{{ currentChannelInfo.orgData.displayName }}</h3>
        </div>
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
import { friendInfoSettingDrawer } from './channelInfo/index'

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

const onOpenChannelInfo = () => {
  if (
    currentChannelInfo.value.channel &&
    currentChannelInfo.value.channel.channelType === ChannelTypePerson
  ) {
    friendInfoSettingDrawer({})
  }
}
</script>

<style lang="less" scoped></style>
