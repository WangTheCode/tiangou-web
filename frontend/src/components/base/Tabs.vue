<template>
  <div class="tabs flex items-center justify-center">
    <div
      class="flex-1 text-center cursor-pointer text-gray-700 hover:text-black"
      :class="{ active: activeTab === tab.key }"
      v-for="tab in tabs"
      :key="tab.key"
      @click="activeTab = tab.key"
    >
      <span>{{ tab.label }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  tabs: {
    type: Array,
    default: () => [],
  },
  activeKey: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['update:activeKey'])
const activeTab = ref(props.activeKey)
watch(activeTab, (newVal) => {
  emit('update:activeKey', newVal)
})

defineOptions({
  name: 'BaseTabs',
})
</script>

<style lang="less" scoped>
.tabs {
  .active {
    font-weight: bold;
    position: relative;
    color: #000;
    &::after {
      position: absolute;
      bottom: -6px;
      left: 50%;
      transform: translateX(-50%);
      content: '';
      display: block;
      width: 24px;
      height: 6px;
      background-image: url('/images/tab-active-line.png');
      background-size: 100% 100%;
      background-repeat: no-repeat;
    }
  }
}
</style>
