<template>
    <div class="flex p-3 hover:bg-[#f1f1f1] cursor-pointer rounded-md" :class="{'bg-[var(--primary-color)]': isCurrent}">
        <div class="w-[50px] h-[50px] rounded-lg overflow-hidden">
            <img :src="avatar" alt="" class="w-full h-full object-cover"></img>
        </div>
        <div class="flex-1 pl-3" style="width: calc(100% - 50px);">
            <div v-if="channelInfo" class="flex leading-8 items-center">
                <div class="font-bold flex flex-1 min-w-0">
                    <h4 class="truncate ">{{ channelInfo.orgData.displayName }}</h4>
                    <span v-if="channelInfo.orgData.identityIcon" class="flex-shrink-0 ml-1">
                        <img :style="{
                            width:  channelInfo.orgData.identitySize && channelInfo.orgData.identitySize.width?channelInfo.orgData.identitySize.width:'18px',
                            height: channelInfo.orgData.identitySize && channelInfo.orgData.identitySize.height?channelInfo.orgData.identitySize.height:'18px'
                        }"
                            :src="channelInfo.orgData.identityIcon"
                        ></img>
                    </span>
                    <svg v-if="channelInfo.mute" class="flex-shrink-0 ml-1" viewBox="0 0 1131 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="2755" width="14" height="14"><path d="M914.688 892.736L64 236.224l38.784-50.88L271.36 315.648a300.288 300.288 0 0 1 246.976-157.952v-33.28c0-16.64 13.504-30.08 30.08-30.08h2.304c16.576 0 30.08 13.44 30.08 30.08v32.96a299.776 299.776 0 0 1 284.928 299.136v294.272l45.504 58.624 48.768 37.696-45.312 45.632zM234.624 480.384l506.88 391.232H140.416l94.272-121.536-0.064-269.696z" fill="#bfbfbf" p-id="2756"></path></svg>
                </div>
                <div class="text-xs text-gray-500 text-right flex-shrink-0 ml-2" style="width: 95px;">{{ getTimeStringAutoShort2(item.timestamp * 1000, true) }}</div>
            </div>
            <div class="text-xs text-gray-500 truncate leading-4">
                <label v-for="r in item.simpleReminders" :key="r.reminderID"  >{{r.text}}</label>
                <span>{{ lastContent(item) }}</span>
            </div>
        </div>
    </div>
</template>

<script setup>
import { avatarChannel } from '@global/tsdd/index'
import { getTimeStringAutoShort2 } from '@global/utils/chat/time'
import { getRevokeTip,getFlameTip } from '@global/utils/chat/index'
import WKSDK,{ Channel,  ChannelTypePerson } from "wukongimjssdk";

const props = defineProps({
    item: {
        type: Object,
        required: true
    },
    isCurrent: {
        type: Boolean,
        required: false
    }
})

const channelInfo = computed(() => props.item.channelInfo || {})
const avatar = computed(() => avatarChannel(channelInfo.value.channel))

const lastContent = (conversationWrap) => {
        if (!conversationWrap.lastMessage) {
            return
        }
        const draft = conversationWrap.remoteExtra.draft
        if(draft && draft!=="") {
            return draft
        }
        const lastMessage = {...conversationWrap.lastMessage}
        if (lastMessage.isDeleted) {
            return ""
        }
        if (lastMessage.revoke) {
            return getRevokeTip(lastMessage)
        }
        if(lastMessage.flame) {
            return getFlameTip()
        }
        if (lastMessage.channel && lastMessage.channel.channelType === ChannelTypePerson) {
            return lastMessage.content?.conversationDigest
        } else {

            let from = ""
            if (lastMessage.fromUID && lastMessage.fromUID !== "") {
                const fromChannel = new Channel(lastMessage.fromUID, ChannelTypePerson)
                const fromChannelInfo = WKSDK.shared().channelManager.getChannelInfo(fromChannel)
                if (fromChannelInfo) {
                    from = `${fromChannelInfo.title}: `
                } else {
                    WKSDK.shared().channelManager.fetchChannelInfo(fromChannel)
                }
            }


            return `${from}${lastMessage.content?.conversationDigest || ""}`
        }
    }
</script>

<style lang="less" scoped>

</style>