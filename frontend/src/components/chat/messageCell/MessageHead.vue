<template>
  <div class="message-head" :style="{ color: color }">
    {{ displayName }}
  </div>
</template>

<script setup>
import { ref } from 'vue'
// import { WKSDK, Channel, ChannelTypePerson } from 'wukongimjssdk'
import { newChannel, getChannelInfo } from '@/wksdk/channelManager'

const props = defineProps({
  message: {
    type: Object,
    default: () => ({}),
  },
  timeStyle: {
    type: Object,
    default: () => ({}),
  },
})
const color = ref('#000')
const displayName = ref('')

const titleColors = [
  '#8C8DFF',
  '#7983C2',
  '#6D8DDE',
  '#5979F0',
  '#6695DF',
  '#8F7AC5',
  '#9D77A5',
  '#8A64D0',
  '#AA66C3',
  '#A75C96',
  '#C8697D',
  '#B74D62',
  '#BD637C',
  '#B3798E',
  '#9B6D77',
  '#B87F7F',
  '#C5595A',
  '#AA4848',
  '#B0665E',
  '#B76753',
  '#BB5334',
  '#C97B46',
  '#BE6C2C',
  '#CB7F40',
  '#A47758',
  '#B69370',
  '#A49373',
  '#AA8A46',
  '#AA8220',
  '#76A048',
  '#9CAD23',
  '#A19431',
  '#AA9100',
  '#A09555',
  '#C49B4B',
  '#5FB05F',
  '#6AB48F',
  '#71B15C',
  '#B3B357',
  '#A3B561',
  '#909F45',
  '#93B289',
  '#3D98D0',
  '#429AB6',
  '#4EABAA',
  '#6BC0CE',
  '#64B5D9',
  '#3E9CCB',
  '#2887C4',
  '#52A98B',
]

const hascode = (str) => {
  let hash = 0
  if (hash === 0 && str.length > 0) {
    for (let i = 0; i < str.length; i++) {
      hash = hash * 31 + str.charCodeAt(i)
    }
  }
  return hash
}

const getTitleColor = (title = '') => {
  const v = hascode(title)
  return titleColors[v % titleColors.length]
}

const init = () => {
  const fromChannel = newChannel(props.message.fromUID)
  let channelInfo = getChannelInfo(fromChannel)
  // if (!channelInfo) {
  //   WKSDK.shared().channelManager.fetchChannelInfo(fromChannel)
  // }

  displayName.value =
    channelInfo && channelInfo.orgData && channelInfo.orgData.displayName
      ? channelInfo.orgData.displayName
      : ''
  color.value = getTitleColor(displayName.value)
}
init()
</script>

<style lang="less" scoped>
.message-trail {
  position: relative;
  top: 8px;
  bottom: auto !important;
  float: right;
  line-height: 1;
  height: 14px;
  margin-left: 6px;
  margin-right: -2px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.75);
}
</style>
