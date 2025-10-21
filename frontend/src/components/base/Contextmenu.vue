<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <div>
    <el-dropdown
      ref="contextmenuDropdownRef"
      :virtual-ref="contextmenuRiggerRef"
      :show-arrow="false"
      :popper-options="{
        modifiers: [{ name: 'offset', options: { offset: [0, 0] } }],
      }"
      virtual-triggering
      trigger="contextmenu"
      placement="bottom-start"
      @visible-change="handleVisibleChange"
    >
      <template #dropdown>
        <el-dropdown-menu>
          <el-dropdown-item
            v-for="item in menuItems"
            :key="item.key"
            :disabled="item.disabled"
            :divided="item.divided"
            @click="handleMenuClick(item)"
          >
            <i v-if="item.icon" :class="['iconfont', item.icon]"></i>
            <span class="ml-2">{{ item.label }}</span>
          </el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>
    <Teleport to="body">
      <div
        v-if="visible"
        class="contextmenu-mask"
        @click="close"
        @contextmenu.prevent="close"
      ></div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref } from 'vue'

defineProps({
  menuItems: {
    type: Array,
    default: () => [],
    // menuItems 格式：
    // [
    //   { key: 'copy', label: '复制', icon: IconComponent, disabled: false, divided: false },
    //   { key: 'delete', label: '删除', icon: IconComponent, disabled: false, divided: true },
    // ]
  },
})

const emit = defineEmits(['select'])

const visible = ref(false)
const contextmenuPosition = ref({
  top: 0,
  left: 0,
  bottom: 0,
  right: 0,
})
const contextmenuDropdownRef = ref(null)
const contextmenuRiggerRef = ref({
  getBoundingClientRect: () => contextmenuPosition.value,
})

/**
 * 打开右键菜单
 * @param {MouseEvent} event - 鼠标右键事件
 * @param {Object} data - 附加数据，会在菜单项点击时返回
 */
const open = (event, data = null) => {
  event.preventDefault()
  event.stopPropagation()

  const { clientX, clientY } = event
  contextmenuPosition.value = DOMRect.fromRect({
    x: clientX,
    y: clientY,
  })

  // 保存附加数据
  contextmenuDropdownRef.value._contextData = data

  contextmenuDropdownRef.value?.handleOpen()
}

/**
 * 关闭右键菜单
 */
const close = () => {
  contextmenuDropdownRef.value?.handleClose()
}

/**
 * 处理菜单显示/隐藏状态变化
 */
const handleVisibleChange = (isVisible) => {
  visible.value = isVisible
  if (!isVisible) {
    // 清理附加数据
    if (contextmenuDropdownRef.value) {
      contextmenuDropdownRef.value._contextData = null
    }
  }
}

/**
 * 处理菜单项点击
 */
const handleMenuClick = (item) => {
  if (item.disabled) return

  const contextData = contextmenuDropdownRef.value?._contextData
  emit('select', {
    key: item.key,
    item: item,
    data: contextData,
  })

  // 如果菜单项有自定义的点击处理函数
  if (item.handler && typeof item.handler === 'function') {
    item.handler(contextData)
  }

  close()
}

defineExpose({
  open,
  close,
})
</script>

<style lang="less" scoped>
.contextmenu-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 2000; // 确保在页面内容之上，但在下拉菜单之下
  background: transparent;
}

// 下拉菜单的 z-index 通常是 2001 或更高，所以遮罩层会在菜单下方
:deep(.el-dropdown-menu) {
  z-index: 2001;
}
</style>
