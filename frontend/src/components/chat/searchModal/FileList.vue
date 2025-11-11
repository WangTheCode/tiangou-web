<template>
  <div class="relative">
    <RecycleScroller
      ref="scrollerRef"
      class="h-[500px]"
      :items="dataList"
      :item-size="56"
      key-field="message_id"
      @resize="onResize"
      @scroll="onScroll"
    >
      <template #default="{ item }">
        <div class="flex p-2 cursor-pointer rounded-md hover:bg-[#f0f0f0]">
          <MessageFile :message="item" :showSize="false">
            <template #intro>
              <div class="text-xs text-gray-400">
                {{ item.from_channel.channel_name }} |
                {{ FileHelper.getFileSizeFormat(item.content.size || 0) }} |
                {{ getTimeStringAutoShort2(item.timestamp * 1000, true) }}
              </div>
            </template>
          </MessageFile>
        </div>
      </template>
      <template #after>
        <div v-if="noMore" class="text-center py-4 text-sm text-gray-400">
          {{ dataList.length === 0 ? '暂无数据' : '没有更多了' }}
        </div>
      </template>
    </RecycleScroller>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { RecycleScroller } from 'vue-virtual-scroller'
import useLoading from '@/hooks/useLoading'
import chatApi from '@/api/chat'
import WKSDK, { MessageContentType } from 'wukongimjssdk'
import MessageFile from '../messageCell/MessageFile.vue'
import { Convert } from '@/wksdk/dataConvert'
import FileHelper from '@/utils/helper/fileHelper'
import { getTimeStringAutoShort2 } from '@/wksdk/utils'

const props = defineProps({
  // 取接口返回的字段，默认是friends
  resultField: {
    type: String,
    default: 'message',
  },
})

const { loading, startLoading, endLoading } = useLoading()

const dataList = ref([])
const scrollerRef = ref(null)
const noMore = ref(false)

const pageParams = ref({
  page: 1,
  limit: 20,
})

// 保存当前搜索参数，用于加载更多时使用
const currentSearchParams = ref({
  keyword: '',
  content_type: [],
})

const onResize = () => {
  console.log('onResize')
}

// 滚动事件处理 - 检测是否到达底部并加载更多
const onScroll = (e) => {
  const { scrollTop, clientHeight, scrollHeight } = e.target
  // 距离底部小于 100px 时触发加载更多
  const distanceToBottom = scrollHeight - scrollTop - clientHeight
  if (distanceToBottom < 100) {
    loadMore()
  }
}

const handleResult = (list) => {
  return list.map((v) => {
    if (v.payload) {
      const contentType = v.payload.type
      const messageContent = WKSDK.shared().getMessageContent(contentType)
      if (messageContent) {
        messageContent.decode(Convert.jsonToUint8Array(v.payload))
      }
      if (
        messageContent.contentType === MessageContentType.file &&
        messageContent.content &&
        messageContent.content.name
      ) {
        messageContent.content.name = messageContent.content.name
          .replaceAll('<mark>', '')
          .replaceAll('</mark>', '')
      }
      // if (messageContent && messageContent.content) {
      //   messageContent.content['content'] = '[系统消息]'
      // }
      v.content = messageContent
    }
    return v
  })
}

// 获取数据（首次加载）
const fetchData = (params) => {
  if (loading.value) return
  // 保存搜索参数，供加载更多时使用
  currentSearchParams.value = {
    keyword: params.keyword || '',
    content_type: params.content_type || [],
  }
  startLoading()
  chatApi
    .searchGlobal(params)
    .then((res) => {
      const newList = handleResult(res[props.resultField])
      // 首次加载直接替换数据
      dataList.value = newList || []

      // 判断是否还有更多数据
      noMore.value = !newList || newList.length === 0 || newList.length < pageParams.value.limit
    })
    .finally(() => {
      endLoading()
    })
}

// 加载更多数据
const loadMore = () => {
  // 防止重复加载：正在加载中 或 没有更多数据
  if (loading.value || noMore.value) return

  // 页码增加
  pageParams.value.page += 1

  startLoading()
  chatApi
    .searchGlobal({
      ...currentSearchParams.value,
      page: pageParams.value.page,
      limit: pageParams.value.limit,
    })
    .then((res) => {
      const newList = handleResult(res.messages) || []
      // 追加新数据到列表末尾
      if (newList.length > 0) {
        dataList.value = [...dataList.value, ...newList]
      }

      // 如果返回空数组，标记为没有更多数据
      if (newList.length === 0) {
        noMore.value = true
      }
    })
    .finally(() => {
      endLoading()
    })
}

// 重新加载数据（重置状态）
const reLoadData = (params) => {
  // 重置分页参数
  pageParams.value = {
    page: 1,
    limit: 20,
  }
  // 重置没有更多数据的标记
  noMore.value = false
  // 重新加载
  fetchData({
    keyword: '',
    content_type: [],
    page: pageParams.value.page,
    limit: pageParams.value.limit,
    ...params,
  })
}

defineExpose({
  reLoadData,
})
</script>

<style lang="less" scoped></style>
