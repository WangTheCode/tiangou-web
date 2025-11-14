<template>
  <div
    class="flex p-3 cursor-pointer rounded-md"
    :class="{
      'bg-[var(--primary-color)] text-white': isCurrent,
      'hover:bg-[#f0f0f0]': !isCurrent,
      'bg-[#f1f1f1] rounded-none': channelInfo && channelInfo.top,
    }"
    @click="handleClick"
  >
    <div class="w-[50px] h-[50px] rounded-lg overflow-hidden">
      <img :src="avatar" alt="" class="w-full h-full object-cover" />
    </div>
    <div class="flex-1 pl-3" style="width: calc(100% - 50px)">
      <div v-if="channelInfo && channelInfo.orgData" class="flex leading-8 items-center">
        <div class="font-bold flex flex-1 min-w-0">
          <h4 class="truncate">{{ channelInfo.orgData.displayName }}</h4>
          <span v-if="channelInfo.orgData.identityIcon" class="flex-shrink-0 ml-1 pt-2">
            <img
              :style="{
                width:
                  channelInfo.orgData.identitySize && channelInfo.orgData.identitySize.width
                    ? channelInfo.orgData.identitySize.width
                    : '18px',
                height:
                  channelInfo.orgData.identitySize && channelInfo.orgData.identitySize.height
                    ? channelInfo.orgData.identitySize.height
                    : '18px',
              }"
              :src="channelInfo.orgData.identityIcon"
            />
          </span>
          <span
            v-if="channelInfo.mute"
            class="flex-shrink-0 ml-1 text-gray-500"
            :class="isCurrent ? 'text-white/80' : 'text-gray-500'"
          >
            <i class="iconfont icon-mute-b" style="font-size: 14px"></i>
          </span>
        </div>
        <div
          class="text-xs text-right flex-shrink-0 ml-2"
          :class="isCurrent ? 'text-white/80' : 'text-gray-500'"
        >
          {{ getTimeStringAutoShort2(item.timestamp * 1000, true) }}
        </div>
      </div>
      <div
        class="text-xs truncate leading-4 flex items-center"
        :class="isCurrent ? 'text-white/80' : 'text-gray-500'"
      >
        <div>
          <label v-for="r in item.simpleReminders" :key="r.reminderID">
            {{ r.text }}
          </label>
        </div>
        <div class="flex-1" style="width: calc(100% - 20px)">
          <div class="truncate w-full">{{ lastContent }}</div>
        </div>
        <div v-if="item.unread > 0">
          <Badge :count="item.unread" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { avatarChannel, newChannel, getChannelInfo, fetchChannelInfo } from '@/wksdk/channelManager'
import { getTimeStringAutoShort2, getRevokeTip, getFlameTip } from '@/wksdk/utils'
import { ChannelTypePerson } from 'wukongimjssdk'
import Badge from '@/components/base/Badge.vue'
import { useChatStore } from '@/stores/index'

const props = defineProps({
  item: {
    type: Object,
    required: true,
  },
  isCurrent: {
    type: Boolean,
    required: false,
  },
  userInfo: {
    type: Object,
    required: true,
  },
})

const chatStore = useChatStore()

watch(
  () => props.item._updateTime,
  () => {
    renderLastContent()
  },
  { deep: true },
)

watch(
  () => chatStore.channelInfoUpdateTrigger,
  () => {
    renderLastContent()
  },
)

// 依赖 Store 的全局触发器来触发重新计算
const channelInfo = computed(() => {
  // eslint-disable-next-line no-unused-vars
  const _ = chatStore.channelInfoUpdateTrigger // 依赖全局触发器
  return props.item.channelInfo || {}
})

const avatar = computed(() => {
  // eslint-disable-next-line no-unused-vars
  const _ = chatStore.channelInfoUpdateTrigger // 依赖全局触发器
  return avatarChannel(props.item.channel)
})

const lastContent = ref('')

const renderLastContent = async () => {
  const conversationWrap = props.item
  const lastMessage = conversationWrap.lastMessage
  if (!lastMessage) {
    lastContent.value = ''
    return
  }
  const draft = conversationWrap.remoteExtra?.draft
  if (draft && draft !== '') {
    lastContent.value = draft
    return
  }
  if (lastMessage.isDeleted) {
    lastContent.value = ''
    return
  }
  if (lastMessage.revoke) {
    lastContent.value = getRevokeTip(lastMessage)
    return
  }
  if (lastMessage.flame) {
    lastContent.value = getFlameTip()
    return
  }
  if (lastMessage.channel && lastMessage.channel.channelType === ChannelTypePerson) {
    lastContent.value = lastMessage.content?.conversationDigest || ''
  } else {
    // 群消息
    let from = ''
    if (lastMessage.fromUID && lastMessage.fromUID !== '') {
      const fromChannel = newChannel(lastMessage.fromUID, ChannelTypePerson)
      const fromChannelInfo = getChannelInfo(fromChannel)
      if (fromChannelInfo) {
        from = `${fromChannelInfo.title}: `
      } else {
        const channelInfo = await fetchChannelInfo(fromChannel)
        // debugger
        from = `${channelInfo.title}: `
      }
    }

    lastContent.value = `${from}${lastMessage.content?.conversationDigest || ''}`
  }
}

const emit = defineEmits(['click'])

onMounted(() => {
  renderLastContent()
})

const handleClick = () => {
  emit('click', props.item)
}
</script>

<style lang="less" scoped></style>
