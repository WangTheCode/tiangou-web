# Contextmenu 右键菜单组件

通用的右键菜单组件，可在任意位置调用，支持自定义菜单项、数据传递和事件处理。

## 特性

- ✅ 可在任意元素上触发右键菜单
- ✅ 支持传递数据给菜单项处理函数
- ✅ 自动显示遮罩层阻止页面其他操作
- ✅ 支持动态菜单项
- ✅ 支持菜单项禁用、分割线等
- ✅ 支持图标显示
- ✅ 使用 Teleport 确保层级正确

## 基础用法

### 1. 引入组件

```vue
<script setup>
import { ref } from 'vue'
import Contextmenu from '@/components/base/Contextmenu.vue'

const contextmenuRef = ref(null)
</script>
```

### 2. 定义菜单项

```javascript
const menuItems = [
  {
    key: 'copy', // 唯一标识
    label: '复制', // 显示文本
    icon: Copy, // Element Plus 图标组件（可选）
    disabled: false, // 是否禁用（可选）
    divided: false, // 是否显示分割线（可选）
  },
  { key: 'paste', label: '粘贴' },
  { key: 'delete', label: '删除', divided: true },
]
```

### 3. 在模板中使用

```vue
<template>
  <!-- 右键触发区域 -->
  <div @contextmenu="(e) => contextmenuRef.open(e)">右键点击此处</div>

  <!-- 右键菜单组件 -->
  <Contextmenu ref="contextmenuRef" :menu-items="menuItems" @select="handleMenuSelect" />
</template>
```

### 4. 处理菜单选择

```javascript
const handleMenuSelect = ({ key, item, data }) => {
  console.log('选择的菜单:', key)
  console.log('菜单项对象:', item)
  console.log('附加数据:', data)

  switch (key) {
    case 'copy':
      // 处理复制
      break
    case 'paste':
      // 处理粘贴
      break
    case 'delete':
      // 处理删除
      break
  }
}
```

## 高级用法

### 传递数据给菜单

当右键不同的元素时，可以传递该元素的数据：

```vue
<template>
  <div v-for="item in list" :key="item.id" @contextmenu="(e) => contextmenuRef.open(e, item)">
    {{ item.name }}
  </div>

  <Contextmenu ref="contextmenuRef" :menu-items="menuItems" @select="handleMenuSelect" />
</template>

<script setup>
const list = ref([
  { id: 1, name: '项目A' },
  { id: 2, name: '项目B' },
])

const handleMenuSelect = ({ key, data }) => {
  if (key === 'delete') {
    console.log('删除项目:', data.name, data.id)
  }
}
</script>
```

### 菜单项自带处理函数

菜单项可以直接定义处理函数：

```javascript
const menuItems = [
  {
    key: 'copy',
    label: '复制',
    handler: (data) => {
      console.log('复制:', data)
      // 直接在这里处理逻辑
    },
  },
]
```

### 动态菜单项

根据不同条件显示不同的菜单：

```vue
<script setup>
import { computed } from 'vue'

const currentUser = ref({ role: 'admin' })

const menuItems = computed(() => {
  const items = [
    { key: 'view', label: '查看' },
    { key: 'edit', label: '编辑' },
  ]

  // 仅管理员可见
  if (currentUser.value.role === 'admin') {
    items.push({
      key: 'delete',
      label: '删除',
      divided: true,
    })
  }

  return items
})
</script>
```

### 条件禁用菜单项

```javascript
const menuItems = computed(() => [
  { key: 'copy', label: '复制' },
  {
    key: 'paste',
    label: '粘贴',
    disabled: !hasClipboardData.value, // 动态禁用
  },
])
```

## 完整示例

```vue
<template>
  <div class="message-list">
    <div
      v-for="msg in messages"
      :key="msg.id"
      class="message-item"
      @contextmenu="(e) => handleContextMenu(e, msg)"
    >
      {{ msg.content }}
    </div>
  </div>

  <Contextmenu
    ref="contextmenuRef"
    :menu-items="messageMenuItems"
    @select="handleMessageMenuSelect"
  />
</template>

<script setup>
import { ref, computed } from 'vue'
import Contextmenu from '@/components/base/Contextmenu.vue'
import { Copy, Delete, Edit } from '@element-plus/icons-vue'

const contextmenuRef = ref(null)
const messages = ref([
  { id: 1, content: '消息1', isMine: true },
  { id: 2, content: '消息2', isMine: false },
])

// 定义菜单项
const messageMenuItems = [
  { key: 'copy', label: '复制', icon: Copy },
  { key: 'forward', label: '转发' },
  { key: 'edit', label: '编辑', icon: Edit },
  { key: 'delete', label: '删除', icon: Delete, divided: true },
]

const handleContextMenu = (event, message) => {
  // 可以在这里根据消息动态调整菜单项
  contextmenuRef.value.open(event, message)
}

const handleMessageMenuSelect = ({ key, data }) => {
  const message = data

  switch (key) {
    case 'copy':
      navigator.clipboard.writeText(message.content)
      console.log('已复制')
      break
    case 'edit':
      if (message.isMine) {
        console.log('编辑消息:', message.id)
      }
      break
    case 'delete':
      if (confirm('确定删除此消息？')) {
        console.log('删除消息:', message.id)
      }
      break
    case 'forward':
      console.log('转发消息:', message.id)
      break
  }
}
</script>
```

## Props

| 参数      | 说明           | 类型  | 默认值 |
| --------- | -------------- | ----- | ------ |
| menuItems | 菜单项配置数组 | Array | []     |

### menuItems 配置项

| 参数     | 说明                  | 类型      | 必填 |
| -------- | --------------------- | --------- | ---- |
| key      | 菜单项唯一标识        | String    | 是   |
| label    | 显示文本              | String    | 是   |
| icon     | Element Plus 图标组件 | Component | 否   |
| disabled | 是否禁用              | Boolean   | 否   |
| divided  | 是否显示上分割线      | Boolean   | 否   |
| handler  | 点击处理函数          | Function  | 否   |

## Events

| 事件名 | 说明               | 回调参数            |
| ------ | ------------------ | ------------------- |
| select | 菜单项被选择时触发 | { key, item, data } |

### select 事件参数

- `key`: 被选择的菜单项的 key
- `item`: 完整的菜单项对象
- `data`: 调用 `open(event, data)` 时传递的数据

## Methods

| 方法名 | 说明         | 参数          |
| ------ | ------------ | ------------- |
| open   | 打开右键菜单 | (event, data) |
| close  | 关闭右键菜单 | -             |

### open 方法参数

- `event`: 鼠标右键事件对象
- `data`: 可选，传递给菜单处理函数的数据

## 注意事项

1. 组件使用 `Teleport` 将遮罩层挂载到 `body`，确保遮罩层在正确的层级
2. 遮罩层的 `z-index` 为 2000，下拉菜单为 2001
3. 点击遮罩层或右键遮罩层都会关闭菜单
4. 菜单项的 `handler` 函数会在 `select` 事件之前执行
5. 如果菜单项设置了 `disabled: true`，点击时不会触发任何事件

## 样式自定义

可以通过全局样式覆盖下拉菜单样式：

```css
/* 自定义菜单样式 */
.el-dropdown-menu {
  min-width: 150px;
}

.el-dropdown-menu__item {
  padding: 10px 20px;
}
```

## 浏览器兼容性

- 现代浏览器（Chrome, Firefox, Safari, Edge）
- 依赖 Element Plus 组件库
- 使用了 Vue 3 Teleport 特性
