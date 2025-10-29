<template>
  <div class="border-t border-gray-200 px-2 pb-2">
    <div v-if="userInfo.ban_speech" class="ban-speech-wraper">
      <div class="ban-speech-text">您已被禁言/全员禁言</div>
    </div>
    <div
      v-else-if="showSelectMessage"
      class="flex justify-center items-center relative"
      style="height: 130px"
    >
      <a class="absolute top-5 right-5 cursor-pointer" @click="onCancelSelect">
        <i class="iconfont icon-close text-2xl"></i>
      </a>
      <div class="grid grid-cols-3 gap-2 w-[320px]">
        <div class="flex flex-col items-center justify-center cursor-pointer" @click="onForward">
          <IconButton
            size="lg"
            icon="icon-share"
            icon-size="20px"
            round
            bg-color="#f1f1f1"
            hover-bg-color="#e1e1e1"
          />
          <div class="text-xs text-gray-500 mt-2">转发</div>
        </div>
        <div
          class="flex flex-col items-center justify-center cursor-pointer"
          @click="onMergeForward"
        >
          <IconButton
            size="lg"
            icon="icon-share-list"
            icon-size="20px"
            round
            bg-color="#f1f1f1"
            hover-bg-color="#e1e1e1"
          />
          <div class="text-xs text-gray-500 mt-2">合并转发</div>
        </div>
        <div class="flex flex-col items-center justify-center cursor-pointer" @click="onDelete">
          <IconButton
            size="lg"
            icon="icon-delete"
            icon-size="20px"
            round
            bg-color="#f1f1f1"
            hover-bg-color="#e1e1e1"
          />
          <div class="text-xs text-gray-500 mt-2">删除</div>
        </div>
      </div>
    </div>
    <div v-else class="chat-window-footer-wraper">
      <div class="chat-input-wraper">
        <div class="tools flex py-1">
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
              <IconButton size="sm" icon="icon-emoji" icon-size="20px" round class="mr-1" />
            </el-tooltip>
            <IconButton size="sm" icon="icon-image" icon-size="20px" round class="mr-1" />
            <IconButton size="sm" icon="icon-attachment" icon-size="20px" round class="mr-1" />
            <IconButton size="sm" icon="icon-box" icon-size="20px" round class="mr-1" />
            <IconButton size="sm" icon="icon-activity" icon-size="20px" round class="mr-1" />
          </div>
          <div v-if="device != 'mobile'">
            <!-- <Tooltip v-model:open="isShowEmojiPicker" placement="left" trigger="click"> -->
            <el-tooltip placement="left" effect="light">
              <IconButton size="sm" icon="icon-menu-dot" round icon-size="20px" />
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
        <div class="textarea mb-1">
          <el-mention
            ref="mentionsRef"
            placeholder="请输入消息"
            v-model="currentText"
            :options="computedMentionOptions"
            :rows="2"
            type="textarea"
            popper-class="chat-input-mention-popper"
            @keydown.enter="onTextareaPressEnter"
            @select="onMentionSelect"
          />
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
import { ElMessage, ElMessageBox } from 'element-plus'
import IconButton from '../base/IconButton.vue'
import { useAppStore, useChatStore } from '@/stores/index'
import { conversationPicker } from './conversationPicker/index'
import { MessageText } from 'wukongimjssdk'
import EmojiPicker from 'vue3-emoji-picker'
import 'vue3-emoji-picker/css'
import { getChannelInfo, newChannel } from '@/wksdk/channelManager'
import { MergeforwardContent } from '@/wksdk/model'

const appStore = useAppStore()
const chatStore = useChatStore()
const device = computed(() => appStore.device)
const sendMessageMode = computed(() => chatStore.sendMessageMode)
const showSelectMessage = computed(() => chatStore.showSelectMessage)

const userInfo = ref({})
const isShowEmojiPicker = ref(false)
const currentText = ref('')
const mentionsRef = ref(null)
let textareaDom = null
let mentionCache = {}
let isMentionSelecting = false // 标记是否正在选择提及项

// 计算提及选项
const computedMentionOptions = computed(() => {
  const subscribers = chatStore.subscribers || []

  // 只有超过1个成员时才启用提及功能
  if (subscribers.length <= 1) {
    return []
  }

  const options = subscribers
    .filter((sub) => !sub.isDeleted && sub.uid !== chatStore.connectUserInfo?.uid)
    .map((sub) => ({
      value: `[${sub.name}]`,
      label: sub.remark || sub.name || sub.uid,
      uid: sub.uid,
      avatar: sub.avatar,
    }))

  // 如果是群聊,添加"所有人"选项
  if (subscribers.length > 2) {
    options.unshift({
      value: '所有人',
      label: '所有人',
      uid: -1,
    })
  }

  return options
})

// 监听提及选择
const onMentionSelect = (option) => {
  // 将选中的用户添加到缓存
  const name = option.value
  mentionCache[name] = {
    uid: option.uid,
    name: name,
  }

  // 设置标志,表示正在选择提及项
  isMentionSelecting = true
  // 延迟重置标志,避免影响后续操作
  setTimeout(() => {
    isMentionSelecting = false
  }, 100)
}

const emit = defineEmits(['sendMessage'])
const setTextareaFocus = () => {
  // textareaDom && textareaDom.focus()
  console.log(mentionsRef.value)
  mentionsRef.value?.focus()
}

const onTextareaPressEnter = (e) => {
  // 检查 el-mention 的下拉菜单是否正在显示
  const isDropdownVisible = !!document.querySelector('.chat-input-mention-popper')

  if (isDropdownVisible || isMentionSelecting) {
    // 下拉菜单显示中或正在选择,不处理发送消息
    console.log('下拉菜单显示中,阻止发送')
    return
  }

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

  // el-mention 组件可能输出格式: @{value} 或 @[name] 或 @name
  // 支持多种格式的正则匹配: @{xxx} @[xxx] @xxx(后面跟空格或结束)

  // 匹配 @{name} 格式 (el-mention 可能的输出)
  newText = newText.replace(/@\{([^}]+)\}/g, '@$1 ')

  // 匹配 @[name] 格式
  newText = newText.replace(/@\[([^\]]+)\]/g, '@$1 ')

  return newText
}

// 解析@信息
const parseMention = (text) => {
  let mention = {
    all: false,
    uids: [],
  }

  if (!mentionCache || Object.keys(mentionCache).length === 0) {
    return undefined
  }

  let all = false
  let mentionUIDS = []

  // 遍历 mentionCache 中的所有成员,检查文本中是否包含他们
  for (const name in mentionCache) {
    const member = mentionCache[name]

    // 检查文本中是否包含这个名字的提及
    // 支持多种格式: @name @{name} @[name]
    const patterns = [
      new RegExp(`@\\{${name}\\}`, 'g'), // @{name}
      new RegExp(`@\\[${name}\\]`, 'g'), // @[name]
      new RegExp(`@${name}(?:\\s|$)`, 'g'), // @name (后面是空格或结束)
    ]

    let found = false
    for (const pattern of patterns) {
      if (pattern.test(text)) {
        found = true
        break
      }
    }

    if (found) {
      if (member.uid === -1) {
        // -1表示@所有人
        all = true
      } else {
        mentionUIDS.push(member.uid)
      }
    }
  }

  if (all) {
    mention.all = true
  } else if (mentionUIDS.length > 0) {
    mention.uids = mentionUIDS
  } else {
    return undefined
  }

  return mention
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
    console.error('输入内容长度不能大于1000字符！')
    return
  }

  // 3. 格式化@提及文本
  let formatValue = formatMentionText(text)

  // 4. 解析@提及信息
  let mention = parseMention(formatValue)

  // 5. 发送消息
  const messageContent = new MessageText(formatValue)
  chatStore.sendMessage({ content: messageContent, mention })

  // 6. 清空输入框和缓存
  currentText.value = ''
  mentionCache = {}
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

// 取消选择消息
const onCancelSelect = () => {
  chatStore.clearSelectedMessages()
}

// 删除选中的消息
const onDelete = async () => {
  const selectedMessages = chatStore.getSelectedMessages()
  if (selectedMessages.length === 0) {
    console.warn('没有选中的消息')
    return
  }

  // 确认删除
  const confirmed = await ElMessageBox.confirm(
    `确定要删除 ${selectedMessages.length} 条消息吗?`,
    '删除消息',
    {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning',
    },
  ).catch(() => false)

  if (!confirmed) {
    return
  }

  try {
    await chatStore.deleteMessages(selectedMessages)
    ElMessage.success('删除成功')
  } catch (error) {
    console.error('删除失败:', error)
    ElMessage.error('删除失败')
  }
}

// 转发消息
const onForward = () => {
  const selectedMessages = chatStore.getSelectedMessages()
  if (selectedMessages.length === 0) {
    console.warn('没有选中的消息')
    return
  }

  conversationPicker({
    title: '转发',
    conversationList: chatStore.conversationList,
    confirm: (selectedItems) => {
      if (selectedItems && selectedItems.length > 0) {
        for (let i = 0; i < selectedItems.length; i++) {
          const channel = selectedItems[i].channel
          for (let j = 0; j < selectedMessages.length; j++) {
            const messageItem = selectedMessages[j]
            const message = {
              content: messageItem.content,
              channel: channel,
            }
            chatStore.sendMessage(message)
          }
        }
      }
      onCancelSelect()
    },
  })
}

// 合并转发消息
const onMergeForward = () => {
  const selectedMessages = chatStore.getSelectedMessages()
  if (selectedMessages.length === 0) {
    console.warn('没有选中的消息')
    return
  }

  conversationPicker({
    title: '合并转发',
    conversationList: chatStore.conversationList,
    multiple: true,
    confirm: (selectedItems) => {
      console.log(selectedItems)

      if (selectedItems && selectedItems.length > 0) {
        let users = []
        for (const message of selectedMessages) {
          let channelInfo = getChannelInfo(newChannel(message.fromUID))
          users.push({ uid: message.fromUID, name: channelInfo?.title })
        }
        for (let i = 0; i < selectedItems.length; i++) {
          const userItem = selectedItems[i]
          const channel = userItem.channel
          const messageContent = new MergeforwardContent(
            channel.channelType,
            users,
            selectedMessages,
          )
          const messageData = {
            content: messageContent,
            channel: channel,
          }
          chatStore.sendMessage(messageData)
          // for (let j = 0; j < selectedMessages.length; j++) {
          //   const messageItem = selectedMessages[j]
          //   const message = {
          //     content: messageItem.content,
          //     channel: channel,
          //   }
          //   chatStore.sendMessage(message)
          // }
        }
        console.log(users)
      }

      onCancelSelect()
    },
  })
  console.log('合并转发消息:', selectedMessages)
}

// 在组件挂载后添加键盘事件监听
onMounted(() => {
  // nextTick(() => {
  //   // 查找 Mentions 组件内部的 textarea 元素
  //   const mentionsEl = mentionsRef.value?.$el || mentionsRef.value
  //   if (mentionsEl) {
  //     textareaDom = mentionsEl.querySelector('textarea')
  //     if (textareaDom) {
  //       textareaDom.addEventListener('keydown', (e) => {
  //         if (e.key === 'Enter' || e.keyCode === 13) {
  //           onTextareaPressEnter(e)
  //         }
  //       })
  //     }
  //   }
  // })
})
</script>

<style lang="less" scoped>
.chat-input-wraper {
  .textarea {
    :deep(textarea) {
      border: none;
      outline: none;
      box-shadow: none;
      &:focus {
        outline: none;
        border: none;
      }
    }
  }
}
</style>
