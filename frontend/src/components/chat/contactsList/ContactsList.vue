<template>
  <div>
    <!-- <div class="pb-2">
      <el-input v-model="keyword" placeholder="联系人" @keyup.enter="handleSearch" />
    </div> -->
    <div>
      <div v-for="key in currentIndexMap" :key="key">
        <div class="text-sm bg-gray-100 p-2 my-1">{{ key }}</div>
        <div>
          <ContactItem
            v-for="item in currentIndexItemMap[key]"
            :key="item.uid"
            :item="item"
            :is-current="currentChannel && currentChannel.channelID === item.uid"
            @click="onContactItemClick(item)"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import ContactItem from './ContactItem.vue'
import { useChatStore } from '@/stores/index'
import { getPinyin } from '@/utils/helper/pinyin'
import { toSimplized } from '@/utils/helper/t2s'
import { ChannelTypePerson } from 'wukongimjssdk'
import { newChannel } from '@/wksdk/channelManager'

const keyword = ref('')

const chatStore = useChatStore()
const currentChannel = computed(() => chatStore.currentChannel)

const allContactList = computed(() => chatStore.contactList)

const currentIndexMap = ref([])
const currentIndexItemMap = ref({})

chatStore.fetchContactList()

const handleSearch = () => {
  console.log(keyword.value)
  renderCurrentContactList()
}

const buildIndex = (contacts) => {
  const indexItemMap = {}
  let indexList = []
  for (const item of contacts) {
    let name = item.name
    if (item.remark && item.remark !== '') {
      name = item.remark
    }

    let pinyinNick = getPinyin(toSimplized(name)).toUpperCase()
    let indexName = !pinyinNick || /[^a-z]/i.test(pinyinNick[0]) ? '#' : pinyinNick[0]

    let existItems = indexItemMap[indexName]
    if (!existItems) {
      existItems = []
      indexList.push(indexName)
    }
    existItems.push(item)
    indexItemMap[indexName] = existItems
  }
  indexList = indexList.sort((a, b) => {
    if (a === '#') {
      return -1
    }
    if (b === '#') {
      return 1
    }
    return a.localeCompare(b)
  })

  currentIndexMap.value = indexList
  currentIndexItemMap.value = indexItemMap
}

const renderCurrentContactList = () => {
  const contactList = allContactList.value.filter((item) => {
    if (keyword.value && !item.name.includes(keyword.value)) {
      return false
    }
    return true
  })
  buildIndex(contactList)
}

watch(
  () => allContactList.value,
  () => {
    renderCurrentContactList()
  },
)

const onContactItemClick = (item) => {
  console.log(item)
  const channel = newChannel(item.uid, ChannelTypePerson)
  chatStore.setCurrentChannel(channel)
}

onMounted(() => {
  renderCurrentContactList()
})
</script>

<style lang="less" scoped></style>
