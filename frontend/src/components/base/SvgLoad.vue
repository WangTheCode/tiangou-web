<template>
  <span
    v-if="svgContent"
    v-html="processedSvg"
    :style="containerStyle"
    class="svg-container"
  ></span>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'

const props = defineProps({
  // SVG 文件名（不含 .svg 后缀）
  name: {
    type: String,
    required: true,
  },
  // 图标颜色
  color: {
    type: String,
    default: '#333',
  },
  // 宽度
  width: {
    type: [String, Number],
    default: undefined,
  },
  // 高度
  height: {
    type: [String, Number],
    default: undefined,
  },
})

// SVG 原始内容
const svgContent = ref('')

// 容器样式
const containerStyle = computed(() => {
  const style = {}
  if (props.width) {
    style.width = typeof props.width === 'number' ? `${props.width}px` : props.width
  }
  if (props.height) {
    style.height = typeof props.height === 'number' ? `${props.height}px` : props.height
  }
  // 设置 CSS 变量，供 SVG 内部使用
  if (props.color && props.color !== 'currentColor') {
    style['--svg-color'] = props.color
  }
  return style
})

// 处理后的 SVG 内容（添加颜色和尺寸）
const processedSvg = computed(() => {
  if (!svgContent.value) return ''

  let processed = svgContent.value

  // 如果指定了颜色，只替换标记为 var(--svg-color) 的颜色
  // 这样只替换 SVG 中明确标记需要动态设置颜色的部分，不影响其他已设置的颜色
  if (props.color && props.color !== 'currentColor') {
    // 替换 fill="var(--svg-color)" 或 fill='var(--svg-color)'
    processed = processed.replace(/fill="var\(--svg-color\)"/g, `fill="${props.color}"`)
    processed = processed.replace(/fill='var\(--svg-color\)'/g, `fill="${props.color}"`)
    // 替换 stroke="var(--svg-color)" 或 stroke='var(--svg-color)'
    processed = processed.replace(/stroke="var\(--svg-color\)"/g, `stroke="${props.color}"`)
    processed = processed.replace(/stroke='var\(--svg-color\)'/g, `stroke="${props.color}"`)
  }

  // 如果指定了尺寸，更新 SVG 的 width 和 height
  if (props.width || props.height) {
    if (props.width) {
      const widthValue = typeof props.width === 'number' ? `${props.width}px` : props.width
      // 只替换 SVG 标签上的 width，不影响内部元素的 width
      processed = processed.replace(/<svg([^>]*\s)width="[^"]*"/, `<svg$1width="${widthValue}"`)
      processed = processed.replace(/<svg([^>]*\s)width='[^']*'/, `<svg$1width="${widthValue}"`)
      // 如果 SVG 标签没有 width 属性，添加它
      if (!/<svg[^>]*\swidth/.test(processed)) {
        processed = processed.replace(/<svg([^>]*)>/, `<svg$1 width="${widthValue}">`)
      }
    }
    if (props.height) {
      const heightValue = typeof props.height === 'number' ? `${props.height}px` : props.height
      // 只替换 SVG 标签上的 height，不影响内部元素的 height
      processed = processed.replace(/<svg([^>]*\s)height="[^"]*"/, `<svg$1height="${heightValue}"`)
      processed = processed.replace(/<svg([^>]*\s)height='[^']*'/, `<svg$1height="${heightValue}"`)
      // 如果 SVG 标签没有 height 属性，添加它
      if (!/<svg[^>]*\sheight/.test(processed)) {
        processed = processed.replace(/<svg([^>]*)>/, `<svg$1 height="${heightValue}">`)
      }
    }
  }

  return processed
})

// 加载 SVG 文件
const loadSvg = async () => {
  if (!props.name) {
    svgContent.value = ''
    return
  }

  try {
    const response = await fetch(`/svg/${props.name}.svg`)
    if (!response.ok) {
      console.error(`Failed to load SVG: /svg/${props.name}.svg`)
      svgContent.value = ''
      return
    }
    svgContent.value = await response.text()
  } catch (error) {
    console.error(`Error loading SVG: /svg/${props.name}.svg`, error)
    svgContent.value = ''
  }
}

// 监听 name 变化，重新加载 SVG
watch(
  () => props.name,
  () => {
    loadSvg()
  },
  { immediate: true },
)

// 组件挂载时加载 SVG
onMounted(() => {
  loadSvg()
})
</script>

<style lang="less" scoped>
.svg-container {
  display: inline-flex;
  align-items: center;
  justify-content: center;

  :deep(svg) {
    display: block;
    width: 100%;
    height: 100%;
  }
}
</style>
