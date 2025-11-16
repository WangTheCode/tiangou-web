<template>
  <div class="flex flex-col" style="height: 500px">
    <div class="p-4">
      <el-input v-model="keyword" size="large" placeholder="搜索" clearable>
        <template #suffix>
          <i class="iconfont icon-search"></i>
        </template>
      </el-input>
    </div>
    <div class="flex-1 overflow-y-auto">
      <div v-if="channelList.length > 0">
        <div
          v-for="item in options"
          :key="item.channel.channelID"
          class="flex cursor-pointer hover:bg-gray-50 px-4 py-1"
          @click="handleItemClick(item)"
        >
          <div class="pt-3 pr-3">
            <Checkbox :model-value="isSelected(item)" />
          </div>
          <div class="flex-1 flex items-center">
            <Avatar :size="50" :src="item.avatar" shape="circle" />
            <div class="flex-1 pl-3">
              <div>{{ item.remark ? item.remark : item.name }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import Avatar from '@/components/base/Avatar.vue'
import Checkbox from '@/components/base/Checkbox.vue'
import { getImageURL } from '@/wksdk/utils'

const props = defineProps({
  channelList: {
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
  onCancel: {
    type: Function,
    default: () => {},
  },
})

const isShow = ref(false)
const keyword = ref('')
const selectedItemsByChannelID = ref({}) // 通过 channelID 存储选中的联系人，提高查找效率
const options = computed(() => {
  return props.channelList.filter((item) => {
    if (keyword.value && !item.remark.includes(keyword.value)) {
      return false
    }
    return true
  })
})

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

const getSelectedItems = () => {
  return Object.values(selectedItemsByChannelID.value)
}

onMounted(() => {
  isShow.value = true
})

defineExpose({
  getSelectedItems,
})
</script>

<style lang="less" scoped></style>
