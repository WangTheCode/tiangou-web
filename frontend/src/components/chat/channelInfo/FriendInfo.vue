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
              class="bg-white/20 rounded-full px-2 py-1 mr-2 text-xs cursor-pointer"
              @click="onSetRemark"
              >设置备注</span
            >
          </div>
          <div v-if="currentChannelInfo && currentChannelInfo.orgData">
            舔狗号：{{ currentChannelInfo.orgData.displayName }} <i class="iconfont icon-copy"></i>
          </div>
        </div>
      </div>
      <div class="bg-white rounded-lg text-base">
        <div class="text-gray-400 p-4">这个用户很懒，没有介绍自己哟~</div>
        <div class="border-b border-gray-100 px-2 pb-4">
          <span class="tag-white-sm">IP:中国</span>
          <span class="tag-white-sm">已实名</span>
        </div>
        <div>
          <div class="cell-item">解除好友关系</div>
          <div class="cell-item">拉入黑名单</div>
          <div class="cell-item border-b border-gray-100">
            <div class="flex-1 leading-[32px]">来源</div>
            <div class="text-gray-400 leading-[32px]">通过搜索添加</div>
          </div>
        </div>
        <div class="grid grid-cols-3 bg-white">
          <div class="flex-1 text-center py-4 hover:bg-gray-100 cursor-pointer text-gray-400">
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
import { getImageURL } from '@/wksdk/channelManager'
import IconButton from '../../base/IconButton.vue'
import { showInputDialog } from '@/components/base/inputDialog/index'

const chatStore = useChatStore()
const currentChannelInfo = computed(() => chatStore.currentChannelInfo || {})

const props = defineProps({
  onCancel: {
    type: Function,
    default: () => {},
  },
})

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
    },
    onCancel() {
      isShowMark.value = false
    },
  })
}

onMounted(() => {
  isShow.value = true
})
</script>

<style lang="less" scoped>
.bg-gradient-dark {
  background-image: linear-gradient(135deg, #ddb8fb 10%, #7675ff 100%);
}
</style>
