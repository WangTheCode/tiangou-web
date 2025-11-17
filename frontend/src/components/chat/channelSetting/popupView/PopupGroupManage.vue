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
      </div>
      <div class="flex-1 bg-gray-100 overflow-y-auto py-4">
        <div class="cell-item">
          <div class="flex-1 leading-[32px]">群聊邀请确认</div>
          <div>
            <el-switch v-model="mute" style="--el-switch-on-color: #13ce66" />
          </div>
        </div>
        <div class="text-gray-400 text-xs p-4 pt-1">
          启用后，群成员需要群主或管理员确认才能邀请朋友进群。扫描二维码进群将同时停用。
        </div>
        <div class="cell-item mb-2" @click="onSetNewOwner">群主管理权转让</div>
        <div class="cell-item">
          <div class="flex-1 leading-[32px]">全员禁言</div>
          <div>
            <el-switch v-model="mute" style="--el-switch-on-color: #13ce66" />
          </div>
        </div>
        <div class="text-gray-400 text-xs p-4 mb-2 pt-1">
          全员禁言启用后，只允许群主和管理员发言。
        </div>
        <div class="cell-item mb-2">
          <div class="flex-1 leading-[32px]">禁止群成员互加好友</div>
          <div>
            <el-switch v-model="mute" style="--el-switch-on-color: #13ce66" />
          </div>
        </div>
        <div class="cell-item">
          <div class="flex-1 leading-[32px]">允许新成员查看历史消息</div>
          <div>
            <el-switch v-model="mute" style="--el-switch-on-color: #13ce66" />
          </div>
        </div>
        <div class="cell-item mb-2">
          <div class="flex-1 leading-[32px]">允许群成员置顶消息</div>
          <div>
            <el-switch v-model="mute" style="--el-switch-on-color: #13ce66" />
          </div>
        </div>
        <div class="cell-item mb-2">
          <div class="flex-1 leading-[32px]" @click="onShowBlackList">群黑名单</div>
        </div>
        <div class="cell-item mb-2" @click="onShowAdminList">
          <div class="flex-1 leading-[32px]">管理员设置</div>
        </div>
        <div class="cell-item mb-2" @click="onDisbandGroup">
          <div class="flex-1 leading-[32px]">解散群聊</div>
        </div>
      </div>
    </div>
  </el-drawer>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import IconButton from '@/components/base/IconButton.vue'
import useLoading from '@/hooks/useLoading'
import chatApi from '@/api/chat'
import { newChannel } from '@/wksdk/channelManager'
import { useChatStore } from '@/stores'
import { showPopupChannelSelect, showPopupBlackList, showPopupAdminList } from './index'
import { ElMessageBox, ElMessage } from 'element-plus'
import { GroupRole } from '@/wksdk/const'
import { closeConversation } from '@/wksdk/conversationManager'

const props = defineProps({
  channelInfo: {
    type: Object,
    default: () => {},
  },
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
  width: {
    type: Number,
    default: 340,
  },
})

const isShow = ref(false)
const { loading, startLoading, endLoading } = useLoading()
const mute = ref(false)
const chatStore = useChatStore()

// 取消按钮点击
const onCancelModal = () => {
  isShow.value = false
  props.onCancel && props.onCancel()
}
const onSetNewOwner = () => {
  let channelList = []
  if (chatStore.subscribers && chatStore.subscribers.length > 0) {
    for (let i = 0; i < chatStore.subscribers.length; i++) {
      const subscriber = chatStore.subscribers[i]
      if (subscriber.role !== GroupRole.owner) {
        continue
      }
      const channel = newChannel(subscriber.uid)
      subscriber.channel = channel
      channelList.push(subscriber)
    }
  }
  showPopupChannelSelect({
    title: '选择新群主',
    appendTo: '#groupSettingPopupView',
    channelList: channelList,
    onSubmit: (value) => {
      return new Promise((resolve, reject) => {
        ElMessageBox.confirm('你将自动放弃群主身份', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning',
        })
          .then(() => {
            chatApi
              .transferGroupOwner({
                groupNo: props.channelInfo.orgData.group_no,
                uid: value[0].uid,
              })
              .then(() => {
                ElMessage.success('转让成功')
                resolve(true)
              })
              .catch((err) => {
                reject(err)
              })
          })
          .catch((err) => {
            reject(err)
          })
      })
    },
  })
}

const onShowBlackList = () => {
  showPopupBlackList({
    title: '群黑名单',
    appendTo: '#groupSettingPopupView',
    channelInfo: props.channelInfo,
  })
}

const onShowAdminList = () => {
  showPopupAdminList({
    title: '管理员设置',
    appendTo: '#groupSettingPopupView',
    channelInfo: props.channelInfo,
  })
}

const onDisbandGroup = () => {
  const conversation = chatStore.getConversationByChannel(props.channelInfo.channel)
  if (conversation) {
    ElMessageBox.confirm(
      '解散后，所有成员将被移出群聊，且聊天记录将被清空，此操作不可恢复',
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      },
    ).then(() => {
      chatApi
        .exitGroup({
          channelID: props.channelInfo.orgData.group_no,
        })
        .then(() => {
          ElMessage.success('群聊已解散')
          chatStore.removeConversation(conversation)
        })
    })
  }
}
onMounted(() => {
  isShow.value = true
})
</script>

<style lang="less" scoped></style>
