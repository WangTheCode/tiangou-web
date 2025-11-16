<template>
  <el-drawer
    v-model="isShow"
    title="聊天消息"
    :size="340"
    :with-header="false"
    @close="onCancelModal"
    modal-class="mark-transparent"
    body-class="body-p-0 border-gray-200"
  >
    <div class="flex flex-col h-full box">
      <div class="flex p-2 border-b border-gray-200">
        <div>
          <IconButton round @click="onCancelModal">
            <i class="iconfont icon-close" />
          </IconButton>
        </div>
        <div class="flex-1 pl-4 leading-[40px]">聊天信息（{{ subscribers.length }}）</div>
      </div>
      <div class="flex-1 bg-gray-100 overflow-y-auto">
        <div v-if="currentChannelInfo && currentChannelInfo.orgData">
          <div class="p-4">
            <div class="grid grid-cols-5 gap-1 items-center text-center">
              <div
                v-for="item in subscribers"
                :key="item.uid"
                class="flex flex-col items-center"
                @click="onShowGroupUserInfo(item)"
              >
                <Avatar :src="item.avatar" shape="circle" :size="50" class="mb-2" />
                <div class="text-xs">
                  {{ item.name }}
                </div>
              </div>
              <div class="flex flex-col items-center">
                <IconButton round bgColor="#fff" hoverBgColor="#fff" size="lg">
                  <i class="iconfont icon-plus text-gray-500" />
                </IconButton>
                <div class="h-[16px]"></div>
              </div>
              <div class="flex flex-col items-center">
                <IconButton round bgColor="#fff" hoverBgColor="#fff" size="lg">
                  <i class="iconfont icon-minus text-gray-500" />
                </IconButton>
                <div class="h-[16px]"></div>
              </div>
            </div>
          </div>
          <div class="cell-item" @click="onSetGroupName">
            <div class="flex-1 leading-[32px]">群聊名称</div>
            <div class="text-gray-400 text-xs leading-[32px]">
              {{ currentChannelInfo.orgData.displayName }}
            </div>
          </div>
          <div class="cell-item" @click="onSetGroupAvatar">
            <div class="flex-1 leading-[32px]">群头像</div>
            <div class="text-gray-400 text-xs leading-[32px]">
              <Avatar :src="getImageURL(currentChannelInfo.logo)" shape="circle" :size="32" />
            </div>
          </div>
          <div class="cell-item" @click="onShowGroupQrcode">
            <div class="flex-1 leading-[32px]">群二维码</div>
            <div class="text-gray-400 text-xs leading-[32px]">
              <i class="iconfont icon-qrcode"></i>
            </div>
          </div>
          <div class="cell-item" @click="onSetGroupNotice">
            <div class="flex-1 leading-[32px]">群公告</div>
            <div class="text-gray-400 text-xs leading-[32px]">
              {{ currentChannelInfo.orgData.notice }}
            </div>
          </div>
          <div class="cell-item mb-2" @click="onSetGroupRemark">
            <div class="flex-1 leading-[32px]">备注</div>
            <div class="text-gray-400 text-xs leading-[32px]">
              {{ currentChannelInfo.orgData.remark }}
            </div>
          </div>
          <div class="cell-item mb-2" @click="onShowSearchModal">查找聊天信息</div>
          <div class="cell-item mb-2" @click="onShowGroupManage">群管理</div>

          <div class="cell-item">
            <div class="flex-1 leading-[32px]">消息免打扰</div>
            <div>
              <el-switch
                v-model="mute"
                style="--el-switch-on-color: #13ce66"
                @change="onMuteChange"
              />
            </div>
          </div>
          <div class="cell-item">
            <div class="flex-1 leading-[32px]">聊天置顶</div>
            <div>
              <el-switch
                v-model="top"
                style="--el-switch-on-color: #13ce66"
                @change="onTopChange"
              />
            </div>
          </div>
          <div class="cell-item mb-2">
            <div class="flex-1 leading-[32px]">保存到通讯录</div>
            <div>
              <el-switch
                v-model="save"
                style="--el-switch-on-color: #13ce66"
                @change="onSaveChange"
              />
            </div>
          </div>
          <div class="cell-item mb-2">
            <div class="flex-1 leading-[32px]">消息回执</div>
            <div>
              <el-switch
                v-model="receipt"
                style="--el-switch-on-color: #13ce66"
                @change="onReceiptChange"
              />
            </div>
          </div>
          <div
            v-if="subscriberOfMe && subscriberOfMe.orgData"
            class="cell-item mb-2"
            @click="onSetMyName"
          >
            <div class="flex-1 leading-[32px]">我在本群的昵称</div>
            <div class="text-gray-400 text-xs leading-[32px]">
              {{
                subscriberOfMe.orgData.remark
                  ? subscriberOfMe.orgData.remark
                  : subscriberOfMe.orgData.name
              }}
            </div>
          </div>
          <div
            class="cell-item justify-center mb-2 text-red-500 text-center cursor-pointer"
            @click="onClearMessages"
          >
            清空聊天记录
          </div>
          <div
            class="cell-item justify-center mb-2 text-red-500 text-center cursor-pointer"
            @click="onDeleteAndExit"
          >
            删除并退出
          </div>
        </div>
      </div>
    </div>
    <div id="groupSettingPopupView"></div>
  </el-drawer>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import Avatar from '@/components/base/Avatar.vue'
import { useChatStore } from '@/stores'
import IconButton from '../../base/IconButton.vue'
import { chatSearchModal } from '../searchModal/index'
import {
  updateSetting,
  closeConversation,
  clearChannelMessages,
  exitGroup,
} from '@/wksdk/conversationManager'
import { ElMessage, ElMessageBox } from 'element-plus'
import { friendInfoDialog } from '../channelInfo/index'
import {
  showPopupTextarea,
  showPopupAvatar,
  showPopupQrcode,
  showPopupGroupManage,
} from './popupView/index'
import chatApi from '@/api/chat'
import WKSDK from 'wukongimjssdk'
import { UserRelation, GroupRole } from '@/wksdk/const'
import {
  getImageURL,
  fetchChannelInfoIfNeed,
  newChannel,
  fetchChannelInfoSync,
} from '@/wksdk/channelManager'
// import * as channelSettingManager from '@/wksdk/channelSettingManager'

const chatStore = useChatStore()
const currentChannel = computed(() => chatStore.currentChannel)
// const currentChannelInfo = computed(() => chatStore.currentChannelInfo || {})

const subscribers = computed(() => chatStore.subscribers)
const props = defineProps({
  onCancel: {
    type: Function,
    default: () => {},
  },
})

const currentChannelInfo = ref({})
const canForbidden = ref(false)
const subscriberOfMe = ref(null)

const fetchChannelInfo = async () => {
  currentChannelInfo.value = await fetchChannelInfoIfNeed(currentChannel.value)
  subscriberOfMe.value = WKSDK.shared().channelManager.getSubscribeOfMe(currentChannel.value)
  if (
    subscriberOfMe.value?.role === GroupRole.owner ||
    subscriberOfMe.value?.role === GroupRole.manager
  ) {
    canForbidden.value = true
  }
}

const top = ref(false)
const mute = ref(false)
const receipt = ref(false)
const save = ref(false)

const renderSwitchData = () => {
  if (currentChannelInfo.value && currentChannelInfo.value.orgData) {
    top.value = currentChannelInfo.value.orgData.top === 1
    mute.value = currentChannelInfo.value.orgData.mute === 1
    receipt.value = currentChannelInfo.value.orgData.receipt === 1
    save.value = currentChannelInfo.value.orgData.save === 1
  } else {
    top.value = false
    mute.value = false
    receipt.value = false
    save.value = false
  }
}
renderSwitchData()

watch(currentChannelInfo, () => {
  renderSwitchData()
})

const isShow = ref(false)
// 取消按钮点击
const onCancelModal = () => {
  isShow.value = false
  props.onCancel && props.onCancel()
}
const onShowSearchModal = () => {
  chatSearchModal({
    channel: currentChannelInfo.value.channel,
  })
}

const onMuteChange = (value) => {
  const conversation = chatStore.getConversationByChannel(currentChannelInfo.value.channel)
  if (conversation) {
    updateSetting(conversation, 'mute', value)
  }
}

const onTopChange = (value) => {
  const conversation = chatStore.getConversationByChannel(currentChannelInfo.value.channel)
  if (conversation) {
    updateSetting(conversation, 'top', value)
  }
}

const onReceiptChange = (value) => {
  const conversation = chatStore.getConversationByChannel(currentChannelInfo.value.channel)
  if (conversation) {
    updateSetting(conversation, 'receipt', value)
  }
}

const onSaveChange = (value) => {
  const conversation = chatStore.getConversationByChannel(currentChannelInfo.value.channel)
  if (conversation) {
    updateSetting(conversation, 'save', value)
  }
}

const onClearMessages = () => {
  const conversation = chatStore.getConversationByChannel(currentChannelInfo.value.channel)
  if (conversation) {
    ElMessageBox.confirm('是否清空此会话的所有消息？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })
      .then(() => {
        clearChannelMessages(conversation).then(() => {
          ElMessage.success('清空成功')
        })
      })
      .catch(() => {})
  }
}
const onDeleteAndExit = () => {
  const conversation = chatStore.getConversationByChannel(currentChannelInfo.value.channel)
  if (conversation) {
    ElMessageBox.confirm('退出后不会通知群里其他成员，且不会再接收此群聊消息？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })
      .then(() => {
        exitGroup(conversation).then(() => {
          ElMessage.success('退出成功')
          closeConversation(conversation)
        })
      })
      .catch(() => {})
  }
}

const onShowGroupUserInfo = (item) => {
  friendInfoDialog({
    uid: item.uid,
    groupNo: item.orgData.group_no,
  })
}

const onSetGroupName = () => {
  showPopupTextarea({
    title: '设置群聊名称',
    placeholder: '请输入',
    appendTo: '#groupSettingPopupView',
    defaultValue: currentChannelInfo.value.orgData.displayName,
    onSubmit(value) {
      return new Promise((resolve, reject) => {
        chatApi
          .updateGroup({
            groupNo: currentChannelInfo.value.orgData.group_no,
            name: value,
          })
          .then(() => {
            ElMessage.success('设置成功')
            currentChannelInfo.value.orgData.displayName = value
            resolve(true)
          })
          .catch((err) => {
            reject(err)
          })
      })
    },
  })
}

const onSetGroupNotice = () => {
  showPopupTextarea({
    title: '设置群公告',
    placeholder: '请输入',
    appendTo: '#groupSettingPopupView',
    defaultValue: currentChannelInfo.value.orgData.notice,
    onSubmit(value) {
      return new Promise((resolve, reject) => {
        chatApi
          .updateGroup({
            groupNo: currentChannelInfo.value.orgData.group_no,
            notice: value,
          })
          .then(() => {
            ElMessage.success('设置成功')
            currentChannelInfo.value.orgData.notice = value
            resolve(true)
          })
          .catch((err) => {
            reject(err)
          })
      })
    },
  })
}

const onSetGroupRemark = () => {
  console.log(currentChannelInfo.value)
  const conversation = chatStore.getConversationByChannel(currentChannelInfo.value.channel)
  if (conversation) {
    showPopupTextarea({
      title: '设置备注',
      placeholder: '请输入',
      appendTo: '#groupSettingPopupView',
      defaultValue: currentChannelInfo.value.orgData.remark,
      onSubmit(value) {
        return new Promise((resolve, reject) => {
          updateSetting(conversation, 'remark', value)
            .then(() => {
              ElMessage.success('设置成功')
              currentChannelInfo.value.orgData.remark = value
              resolve(true)
            })
            .catch((err) => {
              reject(err)
            })
        })
      },
    })
  }
}

const onSetMyName = () => {
  console.log(currentChannelInfo.value)
  const conversation = chatStore.getConversationByChannel(currentChannelInfo.value.channel)
  if (conversation) {
    showPopupTextarea({
      title: '设置我在本群的昵称',
      placeholder: '请输入',
      appendTo: '#groupSettingPopupView',
      defaultValue: subscriberOfMe.value.orgData.remark
        ? subscriberOfMe.value.orgData.remark
        : subscriberOfMe.value.orgData.name,
      onSubmit(value) {
        return new Promise((resolve, reject) => {
          chatApi
            .updateGroupMember({
              groupNo: currentChannelInfo.value.orgData.group_no,
              uid: subscriberOfMe.value.uid,
              remark: value,
            })
            .then(() => {
              ElMessage.success('设置成功')
              subscriberOfMe.value.orgData.remark = value
              chatStore.reloadSubscribers(currentChannelInfo.value.channel)
              resolve(true)
            })
            .catch((err) => {
              reject(err)
            })
        })
      },
    })
  }
}

const onSetGroupAvatar = () => {
  showPopupAvatar({
    title: '设置群头像',
    appendTo: '#groupSettingPopupView',
    src: getImageURL(currentChannelInfo.value.logo),
    onSubmit(value) {
      return new Promise((resolve, reject) => {
        console.log(value)
        chatApi
          .updateGroupAvatar({
            groupNo: currentChannelInfo.value.orgData.group_no,
            file: value.file,
          })
          .then(() => {
            ElMessage.success('设置成功')
            currentChannelInfo.value.logo = value.url
            resolve(true)
          })
          .catch((err) => {
            reject(err)
          })
        // resolve(true)
      })
    },
  })
}

const onShowGroupQrcode = () => {
  showPopupQrcode({
    title: '群二维码',
    appendTo: '#groupSettingPopupView',
    channelInfo: currentChannelInfo.value,
  })
}

const onShowGroupManage = () => {
  showPopupGroupManage({
    title: '群管理',
    appendTo: '#groupSettingPopupView',
    channelInfo: currentChannelInfo.value,
  })
}

onMounted(() => {
  isShow.value = true
  fetchChannelInfo()
})
</script>

<style lang="less" scoped>
.cell-item {
  @apply px-4 py-3 bg-white flex hover:bg-gray-50 cursor-pointer;
}
</style>
