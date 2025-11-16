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
          <el-button type="primary" @click="onSubmit" :loading="loading">{{
            buttonText
          }}</el-button>
        </div>
      </div>
      <div class="flex-1 bg-gray-100 overflow-y-auto">
        <ChannelSelectList
          ref="channelSelectListRef"
          :channelList="channelList"
          :multiple="multiple"
        />
      </div>
    </div>
  </el-drawer>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import IconButton from '@/components/base/IconButton.vue'
import useLoading from '@/hooks/useLoading'
import ChannelSelectList from '@/components/chat/ChannelSelectList.vue'

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
    default: '完成',
  },

  width: {
    type: Number,
    default: 340,
  },
  defaultValue: {
    type: String,
    default: '',
  },
  channelList: {
    type: Array,
    default: () => [],
  },
  multiple: {
    type: Boolean,
    default: false,
  },
})

const isShow = ref(false)
const channelSelectListRef = ref(null)
const { loading, startLoading, endLoading } = useLoading()
// 取消按钮点击
const onCancelModal = () => {
  isShow.value = false
  props.onCancel && props.onCancel()
}

const onSubmit = () => {
  if (loading.value) return
  startLoading()
  try {
    const selectedItems = channelSelectListRef.value.getSelectedItems()
    if (props.onSubmit) {
      props.onSubmit(selectedItems).then(() => {
        onCancelModal()
      })
    } else {
      onCancelModal()
    }
  } finally {
    endLoading()
  }
}

onMounted(() => {
  isShow.value = true
})
</script>

<style lang="less" scoped></style>
