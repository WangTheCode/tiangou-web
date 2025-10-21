<template>
  <div class="flex">
    <div>
      <i class="iconfont icon-reply"></i>
    </div>
    <div class="flex-1">
      <Avatar :channel="fromChannel" shape="circle" size="30" />
      <span>{{ displayName }}</span>
    </div>

    <div>
        
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import Avatar from '@/components/base/Avatar.vue'
import { newChannel, getChannelInfo } from '@/wksdk/channelManager'
const props = defineProps({
  message: {
    type: Object,
    default: () => ({}),
  },
})

const fromChannel = ref(null)
const displayName = ref('')
const channelInfo = ref(null)

watch(props.message, () => {
  renderData()
})

const renderData = () => {
  if (!(props.message && props.message.fromUID)) {
    return
  }
  fromChannel.value = newChannel(props.message.fromUID)
  channelInfo.value = getChannelInfo(fromChannel)

  displayName.value =
    channelInfo.value && channelInfo.value.orgData && channelInfo.value.orgData.displayName
      ? channelInfo.value.orgData.displayName
      : ''
}
renderData()
</script>

<style lang="less" scoped></style>
