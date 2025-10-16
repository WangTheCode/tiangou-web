<template>
  <span class="message-trail">
    <span
      v-if="message.remoteExtra && message.remoteExtra.isEdit"
      class="message-time"
    >
      已编辑
    </span>
    <span
      class="message-time"
      :style="timeStyle"
    >
      {{ dayjs(message.timestamp * 1000).format('HH:mm') }}
    </span>
    <template v-if="message.send && message.status !== MessageStatus.Fail">
      <i
        v-if="message.status == MessageStatus.Wait"
        class="iconfont icon-time"
      ></i>
      <i
        v-else-if="message.readedCount >= 1"
        class="iconfont icon-message-read"
      ></i>
      <i
        v-else
        class="iconfont icon-message-success"
      ></i>
    </template>
  </span>
</template>

<script setup>
import { MessageStatus } from 'wukongimjssdk'
import dayjs from 'dayjs'
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
