<template>
  <el-dialog v-model="isShow" width="400" align-center :show-close="false" class="dialog-p0">
    <template #header>
      <div class="p-4 bg-gray-200">
        <div class="font-bold text-center">{{ title }}</div>
        <div class="text-center text-xs text-gray-500">{{ getTimeline }}</div>
      </div>
    </template>
    <div class="flex flex-col">
      <div class="flex-1 overflow-y-auto" style="max-height: 500px">
        <div v-if="messageList.length > 0">
          <div
            v-for="item in showMessageList"
            :key="item.messageID"
            class="mb-2 flex cursor-pointer hover:bg-gray-50"
            @click="handleItemClick(item)"
          >
            <div class="flex-1 flex items-center">
              <Avatar :size="50" :channel="item.fromChannel" shape="circle" />
              <div class="flex-1 pl-3">
                <div class="font-bold">{{ item.fromChannelInfo.title }}</div>
                <div class="text-xs text-gray-500">{{ item.content.conversationDigest }}</div>
              </div>
              <div class="text-xs text-right flex-shrink-0 ml-2">
                {{ getTimeStringAutoShort2(item.timestamp * 1000, true) }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </el-dialog>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import Avatar from '@/components/base/Avatar.vue'
import { getChannelInfo, newChannel } from '@/wksdk/channelManager'
import { getTimeStringAutoShort2, dateFormat } from '@/wksdk/utils'

const props = defineProps({
  title: {
    type: String,
    default: '消息记录',
  },
  messageList: {
    type: Array,
    default: () => [],
  },
})

const isShow = ref(false)

const showMessageList = computed(() => {
  return props.messageList.map((item) => {
    item.fromChannel = newChannel(item.fromUID)
    item.fromChannelInfo = getChannelInfo(item.fromChannel)
    return item
  })
})

// 取消按钮点击
const onCancel = () => {
  isShow.value = false
}

const handleItemClick = (item) => {
  console.log(item)
}

const getTimeline = computed(() => {
  if (!props.messageList || props.messageList.length === 0) {
    return ''
  }
  if (props.messageList.length === 1) {
    const msg = props.messageList[0]
    return dateFormat(new Date(msg.timestamp * 1000), 'yyyy-MM-dd')
  }
  const firstMsg = props.messageList[0]
  const lastMsg = props.messageList[props.messageList.length - 1]

  return `${dateFormat(new Date(firstMsg.timestamp * 1000), 'yyyy-MM-dd')} ~ ${dateFormat(new Date(lastMsg.timestamp * 1000), 'yyyy-MM-dd')}`
})

onMounted(() => {
  isShow.value = true
})
</script>

<style lang="less" scoped></style>
