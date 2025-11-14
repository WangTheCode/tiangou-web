<template>
  <el-dialog
    v-model="isShow"
    :width="450"
    :with-header="false"
    @close="onCancelModal"
    :modal="false"
    :show-close="false"
    align-center
    body-class="body-p-0 border-gray-200"
    class="dialog-p0"
  >
    <div class="bg-gradient-dark relative">
      <div v-if="isShowMark" class="dialog-content-mark"></div>
      <div class="flex p-4">
        <div class="flex-1 leading-8 text-center text-white text-lg pl-8">好友信息</div>
        <div>
          <IconButton round hoverBgColor="rgba(255, 255, 255, 0.2)" @click="onCancelModal">
            <i class="iconfont icon-close text-white text-lg" />
          </IconButton>
        </div>
      </div>
      <div class="flex px-4 mb-2">
        <Avatar
          :src="getImageURL(currentChannelInfo.logo)"
          shape="circle"
          :size="50"
          class="mb-2"
        />
        <div class="pl-2 text-white">
          <div v-if="currentChannelInfo && currentChannelInfo.orgData" class="text-lg">
            {{ currentChannelInfo.orgData.displayName }}
            <span
              v-if="!isCurrentUser"
              class="bg-white/20 rounded-full px-2 py-1 mr-2 text-xs cursor-pointer"
              @click="onSetRemark"
              >设置备注</span
            >
          </div>
          <div v-if="currentChannelInfo && currentChannelInfo.orgData">
            舔狗号：{{ currentChannelInfo.orgData.short_no }}
            <i class="iconfont icon-copy" @click="onCopyID"></i>
          </div>
        </div>
      </div>
      <div class="bg-white rounded-lg text-base">
        <div class="text-gray-400 p-4">这个用户很懒，没有介绍自己哟~</div>
        <div class="border-b border-gray-100 px-2 pb-4">
          <span class="tag-gray-sm">IP:中国</span>
          <span class="tag-gray-sm">已实名</span>
        </div>
        <div class="pb-10">
          <div v-if="groupNo" class="cell-item border-b border-gray-100">
            <div class="flex-1 leading-[32px]">进群方式</div>
            <div class="text-gray-400 leading-[32px] text-xs">{{ joinDesc }}</div>
          </div>
          <div
            v-if="groupNo && !isCurrentUser && canForbidden"
            class="cell-item"
            @click="onSetGroupUserMute"
          >
            {{ forbiddenRemain > 0 ? `解除禁言` : '群内禁言' }}
          </div>

          <div v-if="currentChannelInfo?.orgData?.follow" class="cell-item" @click="onRemoveFriend">
            解除好友关系
          </div>
          <div
            class="cell-item border-b border-gray-100"
            v-if="userRelation === UserRelation.blacklist && currentChannelInfo?.orgData?.follow"
            @click="onSetBlacklist"
          >
            拉出黑名单
          </div>
          <div
            class="cell-item border-b border-gray-100"
            v-else-if="currentChannelInfo?.orgData?.follow"
            @click="onSetBlacklist"
          >
            拉入黑名单
          </div>
          <div v-if="!isCurrentUser" class="cell-item border-b border-gray-100">
            <div class="flex-1 leading-[32px]">来源</div>
            <div class="text-gray-400 leading-[32px] text-xs">
              {{ currentChannelInfo?.orgData?.source_desc }}
            </div>
          </div>

          <div
            class="p-4 text-xs text-center text-gray-400"
            v-if="userRelation === UserRelation.blacklist"
          >
            <i class="iconfont icon-warning text-red-500"></i>已添加至黑名单，你将不再收到对方的消息
          </div>
        </div>
        <div v-if="!isCurrentUser" class="grid grid-cols-3 bg-white">
          <div
            class="flex-1 text-center py-4 hover:bg-gray-100 cursor-pointer text-gray-400"
            @click="onSendMessage"
          >
            <i class="iconfont icon-chat-f text-4xl"></i>
            <div class="text-sm">发信息</div>
          </div>
          <div class="flex-1 text-center py-4 hover:bg-gray-100 cursor-pointer text-gray-400">
            <i class="iconfont icon-tel text-4xl"></i>
            <div class="text-sm">语音聊天</div>
          </div>
          <div class="flex-1 text-center py-4 hover:bg-gray-100 cursor-pointer text-gray-400">
            <i class="iconfont icon-video text-4xl"></i>
            <div class="text-sm">视频聊天</div>
          </div>
        </div>
      </div>
    </div>
  </el-dialog>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import Avatar from '@/components/base/Avatar.vue'
import { useChatStore } from '@/stores'
import {
  getImageURL,
  fetchChannelInfoIfNeed,
  newChannel,
  fetchChannelInfoSync,
} from '@/wksdk/channelManager'
import IconButton from '../../base/IconButton.vue'
import { showInputDialog } from '@/components/base/inputDialog/index'
import chatApi from '@/api/chat'
import { ElMessage, ElMessageBox } from 'element-plus'
import { copyTextToClipboard } from '@/utils/helper'
import { UserRelation, GroupRole } from '@/wksdk/const'
import { Convert } from '@/wksdk/dataConvert'
import WKSDK from 'wukongimjssdk'

const chatStore = useChatStore()

const props = defineProps({
  uid: {
    type: String,
    default: () => {},
  },
  // 群聊中的用户才有这个参数
  groupNo: {
    type: String,
    default: '',
  },
  onCancel: {
    type: Function,
    default: () => {},
  },
})
const currentChannelInfo = ref({})
const userRelation = ref(1)
const joinDesc = ref('')
const isCurrentUser = ref(false)
// 判断当前登录者在该群内是否为群主或管理员
const canForbidden = ref(false)
const forbiddenRemain = ref(0)

const fetchChannelInfo = async () => {
  if (props.uid) {
    const channel = newChannel(props.uid)
    if (props.groupNo) {
      // 群成员
      const res = await chatApi.getGroupUserChannelInfo({
        uid: props.uid,
        group_no: props.groupNo,
      })
      currentChannelInfo.value = Convert.userToChannelInfo(res)
      console.log(currentChannelInfo.value)

      let joinDescText = `${currentChannelInfo.value.orgData.join_group_time.substr(0, 10)}`
      if (
        currentChannelInfo.value.orgData?.join_group_invite_uid &&
        currentChannelInfo.value.orgData?.join_group_invite_uid !== ''
      ) {
        const inviterChannel = newChannel(currentChannelInfo.value.orgData?.join_group_invite_uid)
        const inviteChannelInfo = await fetchChannelInfoIfNeed(inviterChannel)
        if (inviteChannelInfo) {
          joinDescText += ` ${inviteChannelInfo.title}邀请入群`
        }
      } else {
        joinDescText += '加入群聊'
      }
      joinDesc.value = joinDescText

      const subscriberOfMe = WKSDK.shared().channelManager.getSubscribeOfMe(channel)
      if (subscriberOfMe?.role === GroupRole.owner || subscriberOfMe?.role === GroupRole.manager) {
        canForbidden.value = true
      }

      // 从用户详情接口读取禁言过期时间（单位秒/毫秒兼容）
      if (currentChannelInfo.value.orgData?.group_member) {
        const expRaw = currentChannelInfo.value.orgData?.group_member?.forbidden_expir_time
        let exp = Number(expRaw || 0)
        if (exp > 1e12) {
          // 兼容毫秒
          exp = Math.floor(exp / 1000)
        }
        const nowSec = Math.floor(Date.now() / 1000)
        forbiddenRemain.value = exp - nowSec // >0 表示仍在禁言中
      } else {
        forbiddenRemain.value = 0
      }
    } else {
      const res = await fetchChannelInfoIfNeed(channel)
      currentChannelInfo.value = res
      userRelation.value = res?.orgData.status
    }
    isCurrentUser.value = chatStore.connectUserInfo.channel.channelID === props.uid
  }
}

const isShow = ref(false)
const isShowMark = ref(false)
// 取消按钮点击
const onCancelModal = () => {
  isShow.value = false
  props.onCancel && props.onCancel()
}

const onSetRemark = () => {
  isShowMark.value = true
  showInputDialog({
    title: '设置备注',
    type: 'input',
    placeholder: '请输入备注',
    onSubmit(text) {
      console.log('onSubmit', text)
      return new Promise((resolve, reject) => {
        chatApi
          .setFriendRemark({
            uid: props.uid,
            remark: text,
          })
          .then((res) => {
            console.log('res', res)
            fetchChannelInfoSync(newChannel(props.uid)).then((newChannelInfo) => {
              currentChannelInfo.value = newChannelInfo
            })
            ElMessage.success('设置备注成功')
            resolve(true)
          })
          .catch((err) => {
            console.log('err', err)
            ElMessage.error('设置备注失败')
            reject(err)
          })
      })
    },
    onCancel() {
      isShowMark.value = false
    },
  })
}

const onRemoveFriend = () => {
  const displayName = currentChannelInfo.value.orgData.displayName
  ElMessageBox.confirm(`将联系人“${displayName}”删除，同时删除与该联系人的聊天记录`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(() => {
      chatApi
        .removeFriend({
          uid: props.uid,
        })
        .then(() => {
          ElMessage.success('删除成功')
        })
        .catch((err) => {
          console.log('err', err)
          ElMessage.error('删除失败')
        })
    })
    .catch(() => {})
}

const onSendMessage = () => {
  console.log('onSendMessage')
  const currentChannel = chatStore.currentChannel
  if (currentChannel && currentChannel.channelID === props.uid) {
    // 已经是当前会话，直接发送消息
    onCancelModal()
  } else {
    chatStore.setCurrentChannel(newChannel(props.uid))
    onCancelModal()
  }
}

const onCopyID = () => {
  copyTextToClipboard(currentChannelInfo.value.orgData.short_no)
  ElMessage.success('复制成功')
}

const onSetBlacklist = () => {
  if (userRelation.value === UserRelation.blacklist) {
    chatApi
      .removeUserBlacklist({
        channelID: props.uid,
      })
      .then(() => {
        ElMessage.success('拉出黑名单成功')
        userRelation.value = UserRelation.friend
      })
      .catch((err) => {
        console.log('err', err)
      })
    return
  }
  chatApi
    .addUserBlacklist({
      channelID: props.uid,
    })
    .then(() => {
      ElMessage.success('拉入黑名单成功')
      userRelation.value = UserRelation.blacklist
    })
    .catch((err) => {
      console.log('err', err)
    })
}

const onSetGroupUserMute = () => {
  console.log('onSetGroupUserMute')
  if (forbiddenRemain.value > 0) {
    ElMessageBox.confirm(`该成员当前处于禁言中，解除禁言？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })
      .then(() => {
        chatApi
          .forbiddenWithMember({
            groupNo: props.groupNo,
            member_uid: props.uid,
            action: 0,
          })
          .then(() => {
            ElMessage.success('已解除禁言')
          })
          .catch((err) => {
            console.log('err', err)
            ElMessage.error('解除失败')
          })
      })
      .catch(() => {})
  } else {
    //
  }
}

onMounted(() => {
  isShow.value = true
  fetchChannelInfo()
})
</script>

<style lang="less" scoped>
.bg-gradient-dark {
  background-image: linear-gradient(135deg, #ddb8fb 10%, #7675ff 100%);
}
</style>
