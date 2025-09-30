<template>
  <div class="border-t border-gray-200 p-2">
    <div
      v-if="userInfo.ban_speech"
      class="ban-speech-wraper"
    >
      <div class="ban-speech-text">您已被禁言/全员禁言</div>
    </div>
    <div
      v-else
      class="chat-window-footer-wraper"
    >
      <div class="chat-input-wraper">
        <div class="tools flex">
          <div class="flex-1">
            <Tooltip
              v-model:open="isShowEmojiPicker"
              placement="top"
              trigger="click"
            >
              <template #content>
                <EmojiPicker
                  :native="true"
                  :hide-search="true"
                  class="emoji-picker"
                  @select="onSelectEmoji"
                />
              </template>
              <IconButton
                icon="icon-help"
                round
              />
            </Tooltip>
            <IconButton
              icon="icon-help"
              round
            />
          </div>
          <div v-if="device != 'mobile'">
            <Tooltip
              v-model:open="isShowEmojiPicker"
              placement="left"
              trigger="click"
            >
              <IconButton
                icon="icon-help"
                round
              />
              <template #content>
                <div>
                  <a
                    href="javascript:;"
                    class="block p-2"
                    @click="setSendMessageMode('enter')"
                  >
                    <i
                      v-if="sendMessageMode == 'enter'"
                      class="iconfont icon-help"
                    />
                    <span
                      v-else
                      class="inline-block w-[16px] h-[16px]"
                    ></span>
                    &nbsp;按Enter键发送消息
                  </a>
                  <a
                    class="block p-2"
                    href="javascript:;"
                    @click="setSendMessageMode('ctrl')"
                  >
                    <i
                      v-if="sendMessageMode == 'ctrl'"
                      class="iconfont icon-help"
                    />
                    <span
                      v-else
                      class="inline-block w-[16px] h-[16px]"
                    ></span>
                    &nbsp;按Ctrl+Enter键发送消息
                  </a>
                </div>
              </template>
            </Tooltip>
          </div>
        </div>
        <div class="textarea">
          <textarea
            id="chatTextarea"
            v-model="currentText"
            :bordered="false"
            placeholder="请输入消息"
            auto-size
            class="w-full p-2 border-none"
            @press-enter="onTextareaPressEnter"
          />
        </div>
        <div
          class="text-right"
          @click="setTextareaFocus"
        >
          <Button
            type="primary"
            @click.stop="
              () => {
                onSendMessage()
              }
            "
          >
            发送
          </Button>
        </div>
      </div>
    </div>
    <div
      v-if="device == 'mobile' && isShowEmojiPicker"
      class="mobile-emoji-picker"
    >
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
import { computed, ref, nextTick } from 'vue'
import Tooltip from '../tooltip.vue'
import Button from '../Button.vue'
import IconButton from '../IconButton.vue'

import { useAppStore, useChatStore } from '../../stores/index'

import EmojiPicker from 'vue3-emoji-picker'
import 'vue3-emoji-picker/css'
const appStore = useAppStore()
const chatStore = useChatStore()
const device = computed(() => appStore.device)
const sendMessageMode = computed(() => chatStore.sendMessageMode)

const userInfo = ref({})
const isShowEmojiPicker = ref(false)
const currentText = ref('')
let isEmojiPickerBtnClick = false

const onToggleEmojiPickerShow = () => {
  isShowEmojiPicker.value = !isShowEmojiPicker.value
  isEmojiPickerBtnClick = true
  setTimeout(() => {
    isEmojiPickerBtnClick = false
  }, 100)
}
const setTextareaFocus = () => {
  const textarea = document.querySelector('#chatTextarea')
  textarea.focus()
}
const onTextareaPressEnter = e => {
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

const onSendMessage = content => {
  let text = ''
  if (content) {
    text = content
  } else {
    text = currentText.value.trim()
  }
  console.log(text)

  //   if (!text) {
  //     message.error('请输入消息')
  //     return
  //   }
  //   if (wsStatus.value != 'success') {
  //     message.error('网络连接中，请稍后再试')
  //     return
  //   }
  // if (userStore.ws) {
  //   userStore.ws.send(
  //     JSON.stringify({
  //       event: 'sendGroupMessage',
  //       data: {
  //         content: text,
  //         type: 'text',
  //       },
  //     }),
  //   )
  //   currentText.value = ''
  //   isShowEmojiPicker.value = false
  //   setTimeout(() => {
  //     scrollToBottom()
  //   }, 10)
  // }
}

const insertAtCursor = content => {
  const textarea = document.querySelector('#chatTextarea')
  if (!textarea) return

  // 获取光标位置
  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  if (device.value === 'mobile') {
    textarea.readOnly = true
  }
  // 插入字符并更新绑定值
  currentText.value =
    currentText.value.substring(0, start) + content + currentText.value.substring(end)

  // 更新光标位置
  nextTick(() => {
    textarea.setSelectionRange(start + content.length, start + content.length)
    // 移动端时保持光标但不弹出输入法
    if (device.value === 'mobile') {
      // textarea.readOnly = true
      textarea.focus()
      setTimeout(() => {
        textarea.readOnly = false
      }, 100)
    } else {
      textarea.focus()
    }
  })
}

const onUploadFile = () => {
  document.getElementById('uploadButton')?.click()
}

const onSelectEmoji = emoji => {
  insertAtCursor(emoji.i)
  // isShowEmojiPicker.value = false
}

const setSendMessageMode = mode => {
  chatStore.setSendMessageMode(mode)
}
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
