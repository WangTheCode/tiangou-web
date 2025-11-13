<template>
  <el-drawer
    v-model="isShow"
    title="聊天消息"
    :size="340"
    :with-header="false"
    @close="onCancelModal"
    :modal="false"
    modal-penetrable
    body-class="body-p-0 border-gray-200"
  >
    <div class="flex flex-col h-full">
      <div class="flex p-2 border-b border-gray-200">
        <div>
          <IconButton round @click="onCancelModal">
            <i class="iconfont icon-close" />
          </IconButton>
        </div>
        <div class="flex-1 pl-4 leading-[40px]">聊天信息（1）</div>
      </div>
      <div class="flex-1 bg-gray-100">
        <div class="p-4">
          <div class="grid grid-cols-5 gap-1 items-center text-center">
            <div class="flex flex-col items-center" @click="onOpenChannelInfo">
              <Avatar
                :src="getImageURL(currentChannelInfo.logo)"
                shape="circle"
                :size="50"
                class="mb-2"
              />
              <div v-if="currentChannelInfo && currentChannelInfo.orgData" class="text-xs">
                {{ currentChannelInfo.orgData.displayName }}
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
        <div class="p-4 bg-white mb-2">查找聊天信息</div>
        <div class="px-4 py-3 bg-white flex">
          <div class="flex-1 leading-[32px]">消息免打扰</div>
          <div>
            <el-switch v-model="mute" style="--el-switch-on-color: #13ce66" />
          </div>
        </div>
        <div class="px-4 py-3 bg-white mb-2 flex">
          <div class="flex-1 leading-[32px]">聊天置顶</div>
          <div>
            <el-switch v-model="mute" style="--el-switch-on-color: #13ce66" />
          </div>
        </div>
        <div class="px-4 py-3 bg-white flex">
          <div class="flex-1 leading-[32px]">消息回执</div>
          <div>
            <el-switch v-model="mute" style="--el-switch-on-color: #13ce66" />
          </div>
        </div>
      </div>
    </div>
  </el-drawer>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import Avatar from '@/components/base/Avatar.vue'
import { useChatStore } from '@/stores'
import { getImageURL } from '@/wksdk/channelManager'
import IconButton from '../../base/IconButton.vue'
import { friendInfoSettingDrawer } from '../channelInfo/index'
import { ChannelTypePerson, ChannelTypeGroup } from 'wukongimjssdk'

const chatStore = useChatStore()
const currentChannelInfo = computed(() => chatStore.currentChannelInfo || {})

const props = defineProps({
  onCancel: {
    type: Function,
    default: () => {},
  },
})

const isShow = ref(false)
// 取消按钮点击
const onCancelModal = () => {
  isShow.value = false
  props.onCancel && props.onCancel()
}
const onOpenChannelInfo = () => {
  if (
    currentChannelInfo.value.channel &&
    currentChannelInfo.value.channel.channelType === ChannelTypePerson
  ) {
    friendInfoSettingDrawer({})
  }
}

onMounted(() => {
  isShow.value = true
})
</script>

<style lang="less" scoped></style>
