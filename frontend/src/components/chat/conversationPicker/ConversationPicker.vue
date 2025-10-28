<template>
  <el-dialog v-model="isShow" :title="props.title" width="500" align-center>
    <div class="flex flex-col" style="height: 400px">
      <div class="pb-2">
        <el-input v-model="keyword" size="large" placeholder="搜索" clearable>
          <template #suffix>
            <i class="iconfont icon-search"></i>
          </template>
        </el-input>
      </div>
      <div class="flex-1 overflow-y-auto">
        <div v-if="filteredConversationList.length > 0">
          <div class="bg-gray-100 p-2">最近聊天</div>
          <div
            v-for="item in filteredConversationList"
            :key="item.channel.channelID"
            class="mb-2 flex cursor-pointer hover:bg-gray-50"
            @click="handleItemClick(item)"
          >
            <div class="pt-3 pr-3">
              <Checkbox :model-value="isSelected(item)" />
            </div>
            <div class="flex-1 flex items-center">
              <Avatar :size="50" :src="getImageURL(item.logo)" shape="circle" />
              <div class="flex-1 pl-3">
                <div class="font-bold">{{ item.title }}</div>
              </div>
            </div>
          </div>
        </div>
        <div v-if="filteredFriendList.length > 0">
          <div class="bg-gray-100 p-2">好友</div>
          <div
            v-for="item in filteredFriendList"
            :key="item.channel.channelID"
            class="mb-2 flex cursor-pointer hover:bg-gray-50"
            @click="handleItemClick(item)"
          >
            <div class="pt-3 pr-3">
              <Checkbox :model-value="isSelected(item)" />
            </div>
            <div class="flex-1 flex items-center">
              <Avatar :size="50" :src="item.logo" shape="circle" />
              <div class="flex-1 pl-3">
                <div class="font-bold">{{ item.title }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="flex justify-between items-center pt-3 border-t">
        <div class="text-sm text-gray-500">
          已选择 <span class="text-primary font-bold">{{ selectedCount }}</span> 个联系人
        </div>
        <div class="space-x-2">
          <el-button @click="onCancel">取消</el-button>
          <el-button type="primary" :disabled="selectedCount === 0" @click="onConfirm">
            确定
          </el-button>
        </div>
      </div>
    </div>
  </el-dialog>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import Avatar from '@/components/base/Avatar.vue'
import Checkbox from '@/components/base/Checkbox.vue'
import { getImageURL } from '@/wksdk/utils'
import { ChannelInfo } from 'wukongimjssdk'
import { newChannel, avatarChannel } from '@/wksdk/channelManager'

import chatApi from '@/api/chat'

const props = defineProps({
  title: {
    type: String,
    default: '好友',
  },
  conversationList: {
    type: Array,
    default: () => [],
  },
  confirm: {
    type: Function,
    default: () => {},
  },
  multiple: {
    type: Boolean,
    default: false,
  },
})

const isShow = ref(false)
const keyword = ref('')
const friendList = ref([])
const selectedItemsByChannelID = ref({}) // 通过 channelID 存储选中的联系人，提高查找效率

// 过滤会话列表
const filteredConversationList = computed(() => {
  if (!keyword.value.trim()) {
    return (
      props.conversationList.map((item) => {
        return item.channelInfo
      }) || []
    )
  }

  const searchKey = keyword.value.trim().toLowerCase()
  return (props.conversationList || [])
    .filter((item) => {
      const title = item.channelInfo?.title || ''
      return title.toLowerCase().includes(searchKey)
    })
    .map((item) => {
      return item.channelInfo
    })
})

// 过滤好友列表
const filteredFriendList = computed(() => {
  if (!keyword.value.trim()) {
    return friendList.value
  }

  const searchKey = keyword.value.trim().toLowerCase()
  return friendList.value.filter((item) => {
    const title = item.title || ''
    const displayName = item.orgData?.displayName || ''
    return title.toLowerCase().includes(searchKey) || displayName.toLowerCase().includes(searchKey)
  })
})

const fetchFriendList = async () => {
  const resp = await chatApi.syncFriendList({ api_version: 1 })
  const channelInfos = []
  if (resp) {
    for (const data of resp) {
      if (data.is_deleted === 1) {
        continue
      }
      let channelInfo = new ChannelInfo()
      channelInfo.channel = newChannel(data.uid)
      channelInfo.title = data.name
      channelInfo.logo = avatarChannel(channelInfo.channel)
      channelInfo.mute = data.mute === 1
      channelInfo.top = data.top === 1
      channelInfo.orgData = data
      if (!channelInfo.orgData) {
        channelInfo.orgData = {}
      }
      if (channelInfo.orgData.remark && channelInfo.orgData.remark !== '') {
        channelInfo.orgData.displayName = channelInfo.orgData.remark
      } else {
        channelInfo.orgData.displayName = channelInfo.title
      }

      channelInfos.push(channelInfo)
    }
  }
  friendList.value = channelInfos
}

// 计算选中的联系人数量
const selectedCount = computed(() => {
  return Object.keys(selectedItemsByChannelID.value).length
})

// 判断某个联系人是否被选中（O(1) 时间复杂度）
const isSelected = (item) => {
  return !!selectedItemsByChannelID.value[item.channel.channelID]
}

// 处理列表项点击
const handleItemClick = (item) => {
  const channelID = item.channel.channelID

  if (selectedItemsByChannelID.value[channelID]) {
    // 已选中，取消选择
    delete selectedItemsByChannelID.value[channelID]
  } else {
    // 未选中
    if (props.multiple) {
      // 多选模式：直接添加
      selectedItemsByChannelID.value[channelID] = item
    } else {
      // 单选模式：清空之前的选择，只保留当前项
      selectedItemsByChannelID.value = { [channelID]: item }
    }
  }
}

// 取消按钮点击
const onCancel = () => {
  isShow.value = false
}

// 确认按钮点击
const onConfirm = () => {
  if (props.confirm) {
    // 将对象转换为数组后返回
    const selectedItems = Object.values(selectedItemsByChannelID.value)
    props.confirm(selectedItems)
  }
  isShow.value = false
}

onMounted(() => {
  isShow.value = true
  fetchFriendList()
  console.log(props.conversationList)
})
</script>

<style lang="less" scoped></style>
