<template>
  <el-drawer
    v-model="isShow"
    :size="width"
    :with-header="false"
    @close="onCancelModal"
    :modal="false"
    modal-penetrable
    :show-close="false"
    align-center
    body-class="body-p-0 "
    class="popup-view"
  >
    <div class="flex flex-col h-full box">
      <div class="flex p-2 border-b border-gray-200">
        <div>
          <IconButton round @click="onCancelModal">
            <i class="iconfont icon-direction-left" size="sm" />
          </IconButton>
        </div>
        <div class="flex-1 pt-2 pl-2">{{ title }}</div>
        <div class="pt-1">
          <el-button type="primary" @click="onAddBlackList">{{ buttonText }}</el-button>
        </div>
      </div>
      <div class="flex-1 bg-gray-100 overflow-y-auto">
        <div class="py-4">
          <div
            v-for="item in blackList"
            :key="item.uid"
            class="flex-1 flex cursor-pointer hover:bg-gray-50 px-4 py-1"
          >
            <Avatar :size="40" :src="item.avatar" shape="circle" />
            <div class="flex-1 pl-3 leading-[40px]">
              <div>{{ item.remark ? item.remark : item.name }}</div>
            </div>
            <div class="pt-1">
              <IconButton round @click="onRemoveBlackList(item)" size="sm" class="leading-[30px]">
                <i class="iconfont icon-error text-red-500 text-lg" />
              </IconButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  </el-drawer>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import IconButton from '@/components/base/IconButton.vue'
import { useChatStore } from '@/stores'
import { SubscriberStatus } from '@/wksdk/const'
import { newChannel } from '@/wksdk/channelManager'
import { showPopupChannelSelect } from './index'
import { ElMessage, ElMessageBox } from 'element-plus'
import chatApi from '@/api/chat'

const props = defineProps({
  onCancel: {
    type: Function,
    default: () => {},
  },
  onSubmit: {
    type: Function,
    default: () => {},
  },
  title: {
    type: String,
    default: '',
  },
  leftIcon: {
    type: String,
    default: 'icon-close',
  },
  buttonText: {
    type: String,
    default: '添加',
  },

  width: {
    type: Number,
    default: 340,
  },
  channelInfo: {
    type: Object,
    default: () => {},
  },
})

const isShow = ref(false)

const chatStore = useChatStore()

const blackList = computed(() => {
  return chatStore.subscribers.filter(
    (subscriber) => subscriber.status === SubscriberStatus.blacklist,
  )
})

// 取消按钮点击
const onCancelModal = () => {
  isShow.value = false
  props.onCancel && props.onCancel()
}

const onAddBlackList = () => {
  let channelList = []
  if (chatStore.subscribers && chatStore.subscribers.length > 0) {
    let blackListUids = blackList.value.map((item) => item.uid)
    for (let i = 0; i < chatStore.subscribers.length; i++) {
      const subscriber = chatStore.subscribers[i]
      if (blackListUids.includes(subscriber.uid)) {
        continue
      }
      const channel = newChannel(subscriber.uid)
      subscriber.channel = channel
      channelList.push(subscriber)
    }
  }
  if (channelList.length === 0) {
    ElMessage.warning('没有可添加的成员')
    return
  }
  showPopupChannelSelect({
    title: '添加到黑名单',
    appendTo: '#groupSettingPopupView',
    channelList: channelList,
    multiple: true,
    onSubmit: (value) => {
      return new Promise((resolve, reject) => {
        chatApi
          .addGroupBlacklist({
            channelID: props.channelInfo.orgData.group_no,
            uids: value.map((item) => item.uid),
          })
          .then(() => {
            ElMessage.success('添加成功')
            chatStore.reloadSubscribers(props.channelInfo.channel)
            resolve(true)
          })
          .catch((err) => {
            reject(err)
          })
      })
    },
  })
}

const onRemoveBlackList = (item) => {
  ElMessageBox.confirm('确定要将此成员移出黑名单吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(() => {
    chatApi
      .removeGroupBlacklist({
        channelID: props.channelInfo.orgData.group_no,
        uids: [item.uid],
      })
      .then(() => {
        ElMessage.success('移出成功')
        chatStore.reloadSubscribers(props.channelInfo.channel)
      })
  })
}
onMounted(() => {
  isShow.value = true
})
</script>

<style lang="less" scoped></style>
