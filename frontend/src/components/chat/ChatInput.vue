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
              <IconButton size="sm" icon="icon-emoji" icon-size="20px" round class="mr-2" />
            </el-tooltip>
            <IconButton
              size="sm"
              icon="icon-image"
              icon-size="20px"
              round
              class="mr-2"
              @click="onSelectImage"
            />
            <IconButton
              size="sm"
              icon="icon-attachment"
              icon-size="20px"
              round
              class="mr-2"
              @click="onSelectFile"
            />
            <IconButton size="sm" icon="icon-box" icon-size="20px" round class="mr-2" />
            <IconButton size="sm" icon="icon-activity" icon-size="20px" round class="mr-2" />
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
          <ChatInputComponent
            ref="chatInputRef"
            v-model="currentText"
            placeholder="请输入消息"
            :mentionList="computedMentionOptions"
            minHeight="50px"
            maxHeight="100px"
            :enter-behavior="enterBehavior"
            @mention="handleMentionSelect"
            @send="onSendMessage"
            @ctrlEnter="onChatInputCtrlEnter"
            :allow-paste-image="true"
            :border="false"
            accept="image/*"
            @pasteImage="handlePasteImage"
          />
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
    <input
      type="file"
      ref="imageInputRef"
      accept="image/*"
      @change="handleImageChange"
      style="display: none"
    />
    <input type="file" ref="fileInputRef" @change="handleFileChange" style="display: none" />
  </div>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import IconButton from '../base/IconButton.vue'
import { useAppStore, useChatStore } from '@/stores/index'
import { conversationPicker } from './conversationPicker/index'
import { MessageText, Message } from 'wukongimjssdk'
import EmojiPicker from 'vue3-emoji-picker'
import 'vue3-emoji-picker/css'
import { getChannelInfo, newChannel } from '@/wksdk/channelManager'
import { MergeforwardContent, ImageContent } from '@/wksdk/model'
import { ChatInput as ChatInputComponent } from 'chat-vue'
import 'chat-vue/lib/style.css' // 修正：style.css 位于 lib 目录下
import { sendFileDialog } from './sendFileDialog/index'
import { isEE } from '@/utils/icp/ipcRenderer'
import { sendFileMessage } from '@/wksdk/chatManager'

const appStore = useAppStore()
const chatStore = useChatStore()
const device = computed(() => appStore.device)
const sendMessageMode = computed(() => chatStore.sendMessageMode)
const showSelectMessage = computed(() => chatStore.showSelectMessage)

const userInfo = ref({})
const isShowEmojiPicker = ref(false)
const currentText = ref('')
const chatInputRef = ref(null)
const imageInputRef = ref(null) // 图片文件输入框引用
const fileInputRef = ref(null) // 文件输入框引用
let mentionCache = {}

const enterBehavior = computed(() => {
  if (sendMessageMode.value === 'enter') {
    return 'submit'
  } else {
    return 'newline'
  }
})
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
      id: sub.uid,
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
      id: 'all',
    })
  }

  return options
})

// 监听提及选择
const handleMentionSelect = (option) => {
  console.log(option)
  // 将选中的用户添加到缓存
  const name = option.label
  mentionCache[name] = {
    uid: option.uid,
    name: name,
  }
}

const onChatInputCtrlEnter = () => {
  console.log('按下 Ctrl+Enter 键')
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

const onSendMessage = () => {
  let text = chatInputRef.value.getText()
  if (text.trim()) {
    text = text.trim()
    text = text.replace(/\n\n/g, '\n') // 将每两个连续换行符替换为一个
  } else {
    return
  }
  //  长度验证（最多1000字符）
  if (text && text.length > 1000) {
    ElMessage.error('输入内容长度不能大于1000字符！')
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

// 处理粘贴的图片
const handlePasteImage = async (file) => {
  sendFileDialog({
    file: file,
    onSubmit: async (imgObj) => {
      return sendFileMessage(file, {
        imgData: imgObj.url,
        width: imgObj.width,
        height: imgObj.height,
      })
    },
  })
}

// 触发图片选择器
const onSelectImage = () => {
  imageInputRef.value?.click()
}

// 触发文件选择器
const onSelectFile = () => {
  fileInputRef.value?.click()
}

// 处理选择的图片文件
const handleImageChange = async (event) => {
  const file = event.target.files?.[0]
  if (!file) return

  sendFileDialog({
    file: file,
    onSubmit: async (imgObj) => {
      return sendFileMessage(file, {
        imgData: imgObj.url,
        width: imgObj.width,
        height: imgObj.height,
      })
    },
  })
  // 清空 input 值，允许选择相同文件
  event.target.value = ''
}

const handleFileChange = async (event) => {
  const file = event.target.files?.[0]
  if (!file) return
  console.log('file', file)
  sendFileDialog({
    file: file,
    onSubmit: async (fileData) => {
      return sendFileMessage(file, fileData)
    },
  })

  // 清空 input 值，允许选择相同文件
  event.target.value = ''
}

const onSelectEmoji = (emoji) => {
  console.log(emoji)
  chatInputRef.value?.insertContent(emoji.i)
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
  chatStore.forwardMessages()
}

// 合并转发消息
const onMergeForward = () => {
  chatStore.mergeForwardMessages()
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
