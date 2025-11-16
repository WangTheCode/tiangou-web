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
      <div class="flex-1 bg-gray-100 overflow-y-auto p-4">
        <div class="bg-white rounded-lg p-4">
          <div class="text-center mb-4">
            <Avatar :src="getImageURL(channelInfo.logo)" class="mx-auto mb-2" />
            <div>{{ channelInfo.orgData.displayName }}</div>
          </div>
          <div class="flex items-center justify-center mb-4 w-[200px] h-[200px] mx-auto">
            <Qrcode v-if="qrcodeSrc" :text="qrcodeSrc" />
          </div>
          <div class="text-center text-xs text-gray-500">
            该二维码{{ qrcodeData.day }}天内({{ qrcodeData.expire }})前有效，重新进入将更新
          </div>
        </div>
      </div>
    </div>
  </el-drawer>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import IconButton from '@/components/base/IconButton.vue'
import useLoading from '@/hooks/useLoading'
import chatApi from '@/api/chat'
import { getImageURL } from '@/wksdk/channelManager'
import Qrcode from '@/components/base/Qrcode.vue'

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
const qrcodeData = ref({})
const qrcodeSrc = ref('')

const fetchQrcode = () => {
  startLoading()
  chatApi
    .getGroupQrcode({
      groupNo: props.channelInfo.orgData.group_no,
    })
    .then((res) => {
      qrcodeData.value = res
      qrcodeSrc.value = res.qrcode
      endLoading()
    })
    .catch(() => {
      endLoading()
    })
}

fetchQrcode()

// 取消按钮点击
const onCancelModal = () => {
  isShow.value = false
  props.onCancel && props.onCancel()
}

onMounted(() => {
  isShow.value = true
})
</script>

<style lang="less" scoped></style>
