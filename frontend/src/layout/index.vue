<template>
  <div :class="['layout-content', 'h-full', appStore.device]">
    <router-view v-slot="{ Component }">
      <transition name="fade-slide" mode="out-in">
        <keep-alive :include="appStore.keepAliveKeys">
          <component :is="handleComponent(Component, $route)" :key="parseRouteKey($route)" />
        </keep-alive>
      </transition>
    </router-view>
    <!-- <keep-pages /> -->
  </div>
</template>

<script setup lang="ts">
import { useAppStore } from '@/stores/modules/app'
import { parseRouteKey } from '@/utils/helper/index'

// import KeepPages from './KeepPages.vue'

const appStore = useAppStore()
const handleComponent = (Component, route) => {
  Component.type.name = parseRouteKey(route)
  return Component
}

defineOptions({
  name: 'LayoutContent',
})
</script>

<style lang="less" scoped>
/* fade-slide */
.fade-slide-leave-active,
.fade-slide-enter-active {
  transition: all 0.3s;
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateX(-30px);
}

.fade-slide-leave-to {
  opacity: 0;
  transform: translateX(30px);
}
</style>
