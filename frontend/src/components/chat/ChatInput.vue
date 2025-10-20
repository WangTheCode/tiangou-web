<template>
  <div class="border-t border-gray-200 p-2">
    <div v-if="userInfo.ban_speech" class="ban-speech-wraper">
      <div class="ban-speech-text">您已被禁言/全员禁言</div>
    </div>
    <div v-else class="chat-window-footer-wraper">
      <div class="chat-input-wraper">
        <div class="tools flex">
          <div class="flex-1">
            <!-- <Tooltip v-model:open="isShowEmojiPicker" placement="top" trigger="click"> -->
            <el-tooltip placement="top" trigger="click" effect="light">
              <template #content>
                <EmojiPicker
                  :native="true"
                  :hide-search="true"
                  class="emoji-picker"
                  @select="onSelectEmoji"
                />
              </template>
              <IconButton icon="icon-emoji" icon-size="20px" round />
            </el-tooltip>
            <IconButton icon="icon-image" icon-size="20px" round />
            <IconButton icon="icon-attachment" icon-size="20px" round />
            <IconButton icon="icon-box" icon-size="20px" round />
            <IconButton icon="icon-activity" icon-size="20px" round />
          </div>
          <div v-if="device != 'mobile'">
            <!-- <Tooltip v-model:open="isShowEmojiPicker" placement="left" trigger="click"> -->
            <el-tooltip placement="left" effect="light">
              <IconButton icon="icon-menu-dot" round icon-size="20px" />
              <template #content>
                <div>
                  <a href="javascript:;" class="block p-2" @click="setSendMessageMode('enter')">
                    <i v-if="sendMessageMode == 'enter'" class="iconfont icon-message-success" />
                    <span v-else class="inline-block w-[16px] h-[16px]"></span>
                    &nbsp;按Enter键发送消息
                  </a>
                  <a class="block p-2" href="javascript:;" @click="setSendMessageMode('ctrl')">
                    <i v-if="sendMessageMode == 'ctrl'" class="iconfont icon-message-success" />
                    <span v-else class="inline-block w-[16px] h-[16px]"></span>
                    &nbsp;按Ctrl+Enter键发送消息
                  </a>
                </div>
              </template>
            </el-tooltip>
          </div>
        </div>
        <div class="textarea">
          <!-- <textarea
            id="chatTextarea"
            v-model="currentText"
            :bordered="false"
            placeholder="请输入消息"
            auto-size
            class="w-full p-2 border-none outline-none focus:outline-none focus:border-none"
            @keydown.enter="onTextareaPressEnter"
          /> -->
          <el-mention ref="mentionsRef" v-model:value="currentText" :rows="2" />
        </div>
        <div class="text-right" @click="setTextareaFocus">
          <el-button
            type="primary"
            @click.stop="
              () => {
                onSendMessage()
              }
            "
          >
            发送
          </el-button>
        </div>
      </div>
    </div>
    <div v-if="device == 'mobile' && isShowEmojiPicker" class="mobile-emoji-picker">
      <EmojiPicker
        :native="true"
        class="emoji-picker"
        :hide-search="true"
        @select="onSelectEmoji"
      />
    </div>
  </div>
</template>

<script setup>
import { computed, ref, nextTick, onMounted } from 'vue'
// import Tooltip from '../tooltip.vue'
// import Button from '../base/'
import IconButton from '../base/IconButton.vue'
// import { Mentions } from 'ant-design-vue'
import { useAppStore, useChatStore } from '@/stores/index'

import EmojiPicker from 'vue3-emoji-picker'
import 'vue3-emoji-picker/css'
const appStore = useAppStore()
const chatStore = useChatStore()
const device = computed(() => appStore.device)
const sendMessageMode = computed(() => chatStore.sendMessageMode)

const userInfo = ref({})
const isShowEmojiPicker = ref(false)
const currentText = ref('')
const mentionsRef = ref(null)
let isEmojiPickerBtnClick = false
let textareaDom = null
let mentionCache = {}

const emit = defineEmits(['sendMessage'])

const onToggleEmojiPickerShow = () => {
  isShowEmojiPicker.value = !isShowEmojiPicker.value
  isEmojiPickerBtnClick = true
  setTimeout(() => {
    isEmojiPickerBtnClick = false
  }, 100)
}
const setTextareaFocus = () => {
  textareaDom && textareaDom.focus()
}

const onTextareaPressEnter = (e) => {
  if (device.value == 'mobile') return
  if (sendMessageMode.value === 'enter') {
    if (e.ctrlKey) {
      // 让光标换行
      insertAtCursor('\n')
      return
    }
    e.preventDefault()
    onSendMessage()
  } else {
    if (e.ctrlKey) {
      onSendMessage()
    }
  }
}

// 格式化@文本
const formatMentionText = (text) => {
  let newText = text
  let mentionMatchResult = newText.match(/@([^ ]+) /g)
  if (mentionMatchResult && mentionMatchResult.length > 0) {
    for (let i = 0; i < mentionMatchResult.length; i++) {
      let mentionStr = mentionMatchResult[i]
      let name = mentionStr.replace('@[', '@').replace(']', '')
      newText = newText.replace(mentionStr, name)
    }
  }
  return newText
}

// 解析@信息
const parseMention = (text) => {
  let mention = {
    all: false,
    uids: [],
  }
  if (mentionCache) {
    let mentions = Object.values(mentionCache)
    let all = false
    if (mentions.length > 0) {
      let mentionUIDS = []
      let mentionMatchResult = text.match(/@([^ ]+) /g)
      if (mentionMatchResult && mentionMatchResult.length > 0) {
        for (let i = 0; i < mentionMatchResult.length; i++) {
          let mentionStr = mentionMatchResult[i]
          let name = mentionStr.trim().replace('@', '')
          let member = mentionCache[name]
          if (member) {
            if (member.uid === -1) {
              // -1表示@所有人
              all = true
            } else {
              mentionUIDS.push(member.uid)
            }
          }
        }
      }
      if (all) {
        mention.all = true
      } else {
        mention.uids = mentionUIDS
      }
    }
    return mention
  }
  return undefined
}

const onSendMessage = (content) => {
  let text = ''
  if (content) {
    text = content
  } else {
    text = currentText.value.trim()
  }
  if (!text) {
    return
  }

  //  长度验证（最多1000字符）
  if (text && text.length > 1000) {
    Notification.error({
      content: '输入内容长度不能大于1000字符！',
    })
    return
  }

  // 3. 格式化@提及文本
  let formatValue = formatMentionText(text)
  // 4. 解析@提及信息
  let mention = parseMention(formatValue)
  // 5. 调用回调函数
  // this.props.onSend(formatValue, mention);
  // }
  console.log(formatValue, mention)
  emit('sendMessage', { text: formatValue, mention })
}

const insertAtCursor = (content) => {
  if (!textareaDom) return

  // 获取光标位置
  const start = textareaDom.selectionStart
  const end = textareaDom.selectionEnd
  if (device.value === 'mobile') {
    textareaDom.readOnly = true
  }
  // 插入字符并更新绑定值
  currentText.value =
    currentText.value.substring(0, start) + content + currentText.value.substring(end)

  // 更新光标位置
  nextTick(() => {
    textareaDom.setSelectionRange(start + content.length, start + content.length)
    // 移动端时保持光标但不弹出输入法
    if (device.value === 'mobile') {
      // textarea.readOnly = true
      textareaDom.focus()
      setTimeout(() => {
        textareaDom.readOnly = false
      }, 100)
    } else {
      textareaDom.focus()
    }
  })
}

const onUploadFile = () => {
  document.getElementById('uploadButton')?.click()
}

const onSelectEmoji = (emoji) => {
  insertAtCursor(emoji.i)
  // isShowEmojiPicker.value = false
}

const setSendMessageMode = (mode) => {
  chatStore.setSendMessageMode(mode)
}

// 在组件挂载后添加键盘事件监听
onMounted(() => {
  nextTick(() => {
    // 查找 Mentions 组件内部的 textarea 元素
    const mentionsEl = mentionsRef.value?.$el || mentionsRef.value
    if (mentionsEl) {
      textareaDom = mentionsEl.querySelector('textarea')
      if (textareaDom) {
        textareaDom.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.keyCode === 13) {
            onTextareaPressEnter(e)
          }
        })
      }
    }
  })
})
</script>

<style lang="less" scoped>
// .chat-window-footer {
//   background: #fff;
//   padding: 0 10px 10px 10px;
//   .tools {
//     .tools-item {
//       padding: 6px 10px;
//       display: inline-block;
//       font-size: 20px;
//       cursor: pointer;
//     }
//   }
//   .quick-actions {
//     padding: 10px;
//     border-bottom: 1px solid #f1f1f1;
//     overflow-x: auto;
//   }
//   .actions {
//     text-align: right;
//   }
//   .ban-speech-wraper {
//     height: 99px;
//     text-align: center;
//     line-height: 99px;
//     .ban-speech-text {
//       color: #999;
//       font-size: 14px;
//     }
//   }
// }
</style>
