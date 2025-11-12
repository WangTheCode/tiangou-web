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
        <div>
          <div v-if="currentChannelInfo && currentChannelInfo.orgData" class="p-4">
            <div class="grid grid-cols-5 gap-1 items-center text-center">
              <div v-for="item in subscribers" :key="item.uid" class="flex flex-col items-center">
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
          <div class="cell-item">
            <div class="flex-1 leading-[32px]">群聊名称</div>
            <div class="text-gray-400 text-xs leading-[32px]">
              {{ currentChannelInfo.orgData.displayName }}
            </div>
          </div>
          <div class="cell-item">
            <div class="flex-1 leading-[32px]">群头像</div>
            <div class="text-gray-400 text-xs leading-[32px]">
              <Avatar :src="getImageURL(currentChannelInfo.logo)" shape="circle" :size="32" />
            </div>
          </div>
          <div class="cell-item">
            <div class="flex-1 leading-[32px]">群二维码</div>
            <div class="text-gray-400 text-xs leading-[32px]">
              <i class="iconfont icon-qrcode"></i>
            </div>
          </div>
          <div class="cell-item">
            <div class="flex-1 leading-[32px]">群公告</div>
            <div class="text-gray-400 text-xs leading-[32px]">未设置</div>
          </div>
          <div class="cell-item mb-2">
            <div class="flex-1 leading-[32px]">备注</div>
            <div class="text-gray-400 text-xs leading-[32px]"></div>
          </div>
          <div class="cell-item mb-2">查找聊天信息</div>
          <div class="cell-item mb-2">群管理</div>

          <div class="cell-item">
            <div class="flex-1 leading-[32px]">消息免打扰</div>
            <div>
              <el-switch v-model="mute" style="--el-switch-on-color: #13ce66" />
            </div>
          </div>
          <div class="cell-item">
            <div class="flex-1 leading-[32px]">聊天置顶</div>
            <div>
              <el-switch v-model="mute" style="--el-switch-on-color: #13ce66" />
            </div>
          </div>
          <div class="cell-item mb-2">
            <div class="flex-1 leading-[32px]">保存到通讯录</div>
            <div>
              <el-switch v-model="mute" style="--el-switch-on-color: #13ce66" />
            </div>
          </div>
          <div class="cell-item mb-2">
            <div class="flex-1 leading-[32px]">消息回执</div>
            <div>
              <el-switch v-model="mute" style="--el-switch-on-color: #13ce66" />
            </div>
          </div>
          <div class="cell-item mb-2">
            <div class="flex-1 leading-[32px]">我在本群的昵称</div>
            <div class="text-gray-400 text-xs leading-[32px]"></div>
          </div>
          <div class="cell-item justify-center mb-2 text-red-500 text-center cursor-pointer">
            清空聊天记录
          </div>
          <div class="cell-item justify-center mb-2 text-red-500 text-center cursor-pointer">
            删除并退出
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

const chatStore = useChatStore()
const currentChannelInfo = computed(() => chatStore.currentChannelInfo || {})

const subscribers = computed(() => chatStore.subscribers)
const mute = ref(false)
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

onMounted(() => {
  isShow.value = true
})
</script>

<style lang="less" scoped>
.cell-item {
  @apply px-4 py-3 bg-white flex hover:bg-gray-50 cursor-pointer;
}
</style>
