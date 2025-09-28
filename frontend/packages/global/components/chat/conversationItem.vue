<template>
    <div class="flex p-2">
        <div class="w-[50px] h-[50px] rounded-lg overflow-hidden">
            <img :src="item.avatar" alt="" class="w-full h-full object-cover"></img>
        </div>
        <div class="flex-1 pl-2">
            <div class="flex justify-between">
                <div class="text-sm font-bold">{{ item.nickname }}</div>
                <div class="text-xs text-gray-500">{{ item.time }}</div>
            </div>
            <div class="text-xs text-gray-500">{{ item.content }}</div>
        </div>
    </div>
</template>

<script setup>
defineProps({
    item: {
        type: Object,
        required: true
    }
})
</script>

<style lang="less" scoped>

</style>