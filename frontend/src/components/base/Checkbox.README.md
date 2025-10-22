# Checkbox 复选框组件

圆形复选框组件，未选中时显示灰色空心圆形，选中时显示主题色背景和勾选图标。

## 特性

- ✅ 支持 v-model 双向绑定
- ✅ 圆形设计，符合现代 UI 风格
- ✅ 选中时显示主题色背景和勾选图标
- ✅ 支持禁用状态
- ✅ 平滑的过渡动画
- ✅ Hover 效果

## 基础用法

### 1. 简单使用

```vue
<template>
  <Checkbox v-model="checked" />
  <p>状态: {{ checked }}</p>
</template>

<script setup>
import { ref } from 'vue'
import Checkbox from '@/components/base/Checkbox.vue'

const checked = ref(false)
</script>
```

### 2. 带文本的复选框

```vue
<template>
  <div class="flex items-center gap-2">
    <Checkbox v-model="agree" />
    <span>我已阅读并同意服务条款</span>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import Checkbox from '@/components/base/Checkbox.vue'

const agree = ref(false)
</script>
```

### 3. 禁用状态

```vue
<template>
  <div class="flex gap-4">
    <Checkbox v-model="checked1" :disabled="true" />
    <Checkbox v-model="checked2" :disabled="true" />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import Checkbox from '@/components/base/Checkbox.vue'

const checked1 = ref(false) // 未选中禁用
const checked2 = ref(true) // 选中禁用
</script>
```

### 4. 监听变化事件

```vue
<template>
  <Checkbox v-model="checked" @change="handleChange" />
</template>

<script setup>
import { ref } from 'vue'
import Checkbox from '@/components/base/Checkbox.vue'

const checked = ref(false)

const handleChange = (value) => {
  console.log('复选框状态改变:', value)
}
</script>
```

## 高级用法

### 复选框列表

```vue
<template>
  <div class="space-y-2">
    <div
      v-for="item in options"
      :key="item.id"
      class="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
      @click="toggleOption(item.id)"
    >
      <Checkbox v-model="item.checked" />
      <span>{{ item.label }}</span>
    </div>
  </div>

  <div class="mt-4">
    <p>已选择: {{ selectedItems.join(', ') }}</p>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import Checkbox from '@/components/base/Checkbox.vue'

const options = ref([
  { id: 1, label: '选项 1', checked: false },
  { id: 2, label: '选项 2', checked: false },
  { id: 3, label: '选项 3', checked: false },
])

const toggleOption = (id) => {
  const option = options.value.find((opt) => opt.id === id)
  if (option) {
    option.checked = !option.checked
  }
}

const selectedItems = computed(() => {
  return options.value.filter((opt) => opt.checked).map((opt) => opt.label)
})
</script>
```

### 全选/取消全选

```vue
<template>
  <div>
    <div class="flex items-center gap-2 p-2 border-b mb-2">
      <Checkbox v-model="selectAll" @change="handleSelectAll" />
      <span class="font-medium">全选</span>
    </div>

    <div class="space-y-2">
      <div v-for="item in items" :key="item.id" class="flex items-center gap-2 p-2">
        <Checkbox v-model="item.checked" @change="updateSelectAll" />
        <span>{{ item.name }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import Checkbox from '@/components/base/Checkbox.vue'

const items = ref([
  { id: 1, name: '项目 A', checked: false },
  { id: 2, name: '项目 B', checked: false },
  { id: 3, name: '项目 C', checked: false },
])

const selectAll = ref(false)

const handleSelectAll = (value) => {
  items.value.forEach((item) => {
    item.checked = value
  })
}

const updateSelectAll = () => {
  selectAll.value = items.value.every((item) => item.checked)
}
</script>
```

### 消息多选模式

```vue
<template>
  <div class="message-list">
    <div
      v-for="msg in messages"
      :key="msg.id"
      class="message-item flex items-center gap-3 p-3 hover:bg-gray-50"
    >
      <Checkbox v-model="msg.selected" />
      <div class="flex-1">
        <div class="font-medium">{{ msg.title }}</div>
        <div class="text-sm text-gray-500">{{ msg.content }}</div>
      </div>
    </div>
  </div>

  <div v-if="selectedCount > 0" class="fixed bottom-0 left-0 right-0 bg-white border-t p-4">
    <div class="flex items-center justify-between">
      <span>已选择 {{ selectedCount }} 条消息</span>
      <div class="flex gap-2">
        <button @click="deleteSelected">删除</button>
        <button @click="clearSelection">取消</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import Checkbox from '@/components/base/Checkbox.vue'

const messages = ref([
  { id: 1, title: '消息标题 1', content: '消息内容...', selected: false },
  { id: 2, title: '消息标题 2', content: '消息内容...', selected: false },
  { id: 3, title: '消息标题 3', content: '消息内容...', selected: false },
])

const selectedCount = computed(() => {
  return messages.value.filter((msg) => msg.selected).length
})

const deleteSelected = () => {
  const selected = messages.value.filter((msg) => msg.selected)
  console.log('删除:', selected)
  // 执行删除操作
}

const clearSelection = () => {
  messages.value.forEach((msg) => {
    msg.selected = false
  })
}
</script>
```

## Props

| 参数       | 说明     | 类型    | 默认值 |
| ---------- | -------- | ------- | ------ |
| modelValue | 绑定值   | Boolean | false  |
| disabled   | 是否禁用 | Boolean | false  |

## Events

| 事件名            | 说明         | 回调参数         |
| ----------------- | ------------ | ---------------- |
| update:modelValue | 值改变时触发 | (value: boolean) |
| change            | 值改变时触发 | (value: boolean) |

## 样式定制

### 修改大小

可以通过覆盖 CSS 变量来修改复选框大小：

```vue
<style scoped>
.custom-checkbox :deep(.checkbox-container) {
  width: 24px;
  height: 24px;
}
</style>
```

### 修改颜色

主题色通过 CSS 变量 `--primary-color` 控制：

```css
:root {
  --primary-color: #409eff; /* 你的主题色 */
}
```

### 修改边框样式

```vue
<style scoped>
.custom-checkbox :deep(.checkbox-container) {
  border-width: 3px;
  border-style: dashed;
}
</style>
```

## 完整样式说明

组件的样式结构：

- 未选中：透明背景 + 灰色边框
- 选中：主题色背景 + 主题色边框 + 白色勾选图标
- Hover：边框颜色加深
- 禁用：降低透明度，禁用鼠标交互

## 浏览器兼容性

- 现代浏览器（Chrome, Firefox, Safari, Edge）
- 使用了 CSS transition 和 flexbox
- 依赖 iconfont 图标库
