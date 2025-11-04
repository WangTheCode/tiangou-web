# Electron 环境图片消息发送方案 - ArrayBuffer 传输

## 方案概述

**核心思路**：在渲染进程将 File 对象读取为 ArrayBuffer，通过 Electron IPC 传递二进制数据（Buffer），主进程接收后重构文件并上传。

---

## 实现步骤

### 第一步：修改 `ImageContent` 类

**文件**：`frontend/src/wksdk/model.js`

```javascript
export class ImageContent extends MediaMessageContent {
  constructor(file, imgData, width, height) {
    super()
    this.file = file              // File 对象（仅 Web 环境使用）
    this.imgData = imgData        // base64 预览数据
    this.width = width || 0
    this.height = height || 0
    
    // 新增：用于 Electron IPC 传输的字段
    this.fileBuffer = null        // ArrayBuffer 数据
    this.fileName = file?.name    // 文件名
    this.fileType = file?.type    // MIME 类型
    this.fileSize = file?.size    // 文件大小
  }
  
  decodeJSON(content) {
    this.width = content['width'] || 0
    this.height = content['height'] || 0
    this.url = content['url'] || ''
    this.remoteUrl = this.url
  }
  
  encodeJSON() {
    return { 
      width: this.width || 0, 
      height: this.height || 0, 
      url: this.remoteUrl || '' 
    }
  }
  
  // 新增：准备 IPC 传输的数据
  toIPCData() {
    return {
      contentType: this.contentType,
      width: this.width,
      height: this.height,
      imgData: this.imgData,
      fileBuffer: this.fileBuffer,  // ArrayBuffer 会被自动转为 Buffer
      fileName: this.fileName,
      fileType: this.fileType,
      fileSize: this.fileSize
    }
  }
  
  get contentType() {
    return MessageContentTypeConst.image
  }
  
  get conversationDigest() {
    return '[图片]'
  }
}
```

---

### 第二步：修改 `ChatInput.vue` - 读取 File 为 ArrayBuffer

**文件**：`frontend/src/components/chat/ChatInput.vue`

```javascript
import { isEE } from '@/utils/icp/ipcRenderer'

// 处理选择的图片文件
const handleImageChange = async (event) => {
  const file = event.target.files?.[0]
  if (!file) return

  console.log('选择图片:', file)
  
  sendFileDialog({
    file: file,
    onSubmit: async (imgObj) => {
      console.log('发送图片:', file, imgObj)
      
      const imageContent = new ImageContent(file, imgObj.previewUrl, imgObj.width, imgObj.height)
      
      // 如果是 Electron 环境，读取文件为 ArrayBuffer
      if (isEE) {
        try {
          const arrayBuffer = await readFileAsArrayBuffer(file)
          imageContent.fileBuffer = arrayBuffer
          console.log('File 已转换为 ArrayBuffer:', arrayBuffer.byteLength, 'bytes')
        } catch (error) {
          console.error('读取文件失败:', error)
          ElMessage.error('读取图片文件失败')
          return
        }
      }
      
      chatStore.sendMessage({
        content: imageContent,
      })
    },
  })

  // 清空 input 值，允许选择相同文件
  event.target.value = ''
}

// 新增：读取 File 为 ArrayBuffer
const readFileAsArrayBuffer = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      resolve(e.target.result)  // ArrayBuffer
    }
    reader.onerror = (e) => {
      reject(e)
    }
    reader.readAsArrayBuffer(file)
  })
}

// 处理粘贴的图片
const handlePasteImage = async (file) => {
  console.log('粘贴图片:', file)
  
  sendFileDialog({
    file: file,
    onSubmit: async (imgObj) => {
      const imageContent = new ImageContent(file, imgObj.previewUrl, imgObj.width, imgObj.height)
      
      // Electron 环境读取 ArrayBuffer
      if (isEE) {
        try {
          const arrayBuffer = await readFileAsArrayBuffer(file)
          imageContent.fileBuffer = arrayBuffer
        } catch (error) {
          console.error('读取粘贴图片失败:', error)
          ElMessage.error('读取粘贴图片失败')
          return
        }
      }
      
      chatStore.sendMessage({
        content: imageContent,
      })
    },
  })
}
```

---

### 第三步：修改 `chat.js` Store - IPC 数据序列化

**文件**：`frontend/src/stores/modules/chat.js`

```javascript
sendMessage(data) {
  return new Promise((resolve, reject) => {
    if (!this.currentConversation) {
      reject(new Error('当前会话不存在'))
      return
    }

    if (data.reply) {
      data.reply = {
        message_id: this.replyMessage.messageID,
        message_seq: this.replyMessage.messageSeq,
        from_uid: this.replyMessage.fromUID,
        payload: JSON.stringify({ contentType: this.replyMessage.contentType, content: this.replyMessage.contentTypeName }),
      }
    }

    if (isEE) {
      if (!data.channel) {
        data.channel = this.currentConversation.channel
      }
      
      // 处理图片消息的特殊序列化
      if (data.content && data.content.contentType === MessageContentTypeConst.image) {
        // 使用 ImageContent 的 toIPCData 方法准备数据
        data.content = data.content.toIPCData()
      } else {
        data.content = { ...data.content, contentType: data.content.contentType }
      }
      
      ipcApiRoute.sendMessage(data).then((res) => {
        console.log('tcp sendMessage----->', res)
        resolve(res)
      })
    } else {
      let channel = this.currentConversation.channel
      if (data.channel) {
        channel = data.channel
      }
      sendMessage(channel, data).then((message) => {
        this.setReplyMessage(null)
        resolve(message)
      })
    }
  })
}
```

---

### 第四步：修改 Electron 主进程 - 重构文件并上传

**文件**：`electron/service/wkim.js`

```javascript
const { Buffer } = require('buffer')
const fs = require('fs')
const path = require('path')
const os = require('os')

async sendMessage(data) {
  const { content, mention, channel, reply } = data
  logger.info('sendMessage----->', JSON.stringify({
    ...content,
    fileBuffer: content.fileBuffer ? `<Buffer ${content.fileBuffer.length} bytes>` : undefined
  }))
  
  let messageContent = content
  
  // 处理文本消息
  if (content && content.text && content.contentType === MessageContentTypeConst.text) {
    messageContent = new MessageText(content.text)
  }
  
  // 处理图片消息
  if (content && content.contentType === MessageContentTypeConst.image) {
    const { MediaMessageContent } = require('wukongimjstcpsdk')
    
    // 创建图片消息内容对象
    class ImageContent extends MediaMessageContent {
      constructor(width, height, localPath, fileName) {
        super()
        this.width = width
        this.height = height
        this.localPath = localPath  // 临时文件路径
        this.fileName = fileName
      }
      
      encodeJSON() {
        return {
          width: this.width,
          height: this.height,
          url: this.remoteUrl || ''
        }
      }
      
      decodeJSON(content) {
        this.width = content.width || 0
        this.height = content.height || 0
        this.url = content.url || ''
        this.remoteUrl = this.url
      }
      
      get contentType() {
        return MessageContentTypeConst.image
      }
    }
    
    // 从 Buffer 重建文件
    let tempFilePath = null
    try {
      if (content.fileBuffer) {
        // 将 ArrayBuffer/Buffer 写入临时文件
        const buffer = Buffer.from(content.fileBuffer)
        const tempDir = os.tmpdir()
        const fileName = content.fileName || `image_${Date.now()}.png`
        tempFilePath = path.join(tempDir, fileName)
        
        fs.writeFileSync(tempFilePath, buffer)
        logger.info(`临时文件已创建: ${tempFilePath}, 大小: ${buffer.length} bytes`)
        
        // 创建 ImageContent 实例
        messageContent = new ImageContent(
          content.width,
          content.height,
          tempFilePath,
          content.fileName
        )
        
        // 重要：设置 file 字段，SDK 需要此字段进行上传
        // 注意：wukongimjstcpsdk 可能需要 fs.ReadStream 或文件路径
        messageContent.file = tempFilePath
      }
    } catch (error) {
      logger.error('处理图片文件失败:', error)
      throw error
    }
  }
  
  // 处理 mention
  if (mention) {
    const mn = new Mention()
    mn.all = mention.all
    mn.uids = mention.uids
    messageContent.mention = mn
  }
  
  // 处理 channel 和 setting
  const channelObject = new Channel(channel.channelID, channel.channelType)
  const channelInfo = WKSDK.shared().channelManager.getChannelInfo(channelObject)
  let setting = new Setting()
  if (channelInfo?.orgData.receipt === 1) {
    setting.receiptEnabled = true
  }
  
  // 处理 reply
  if (reply) {
    messageContent.reply = reply
  }
  
  try {
    // 发送消息
    const message = await this.sdk.chatManager.send(messageContent, channel, setting)
    
    // 清理临时文件（可选）
    // if (tempFilePath && fs.existsSync(tempFilePath)) {
    //   fs.unlinkSync(tempFilePath)
    //   logger.info(`临时文件已删除: ${tempFilePath}`)
    // }
    
    return message
  } catch (error) {
    logger.error('发送消息失败:', error)
    throw error
  }
}
```

---

### 第五步：验证 IPC 路由配置

**文件**：`frontend/src/utils/icp/ipcRoute.js`

确保 `huliInvoke` 方法能够正确传递 Buffer：

```javascript
const huliInvoke = (url, params = null) => {
  return new Promise((resolve, reject) => {
    try {
      // 注意：当 params 包含 ArrayBuffer 时，不要 JSON.stringify
      // Electron IPC 可以直接传输 Buffer
      if (!isEE) {
        reject()
        return
      }
      
      // 修改：对于包含二进制数据的请求，直接传递不序列化
      let processedParams = params
      if (params && typeof params === 'object') {
        // 检查是否包含 fileBuffer
        const hasBuffer = params.content && params.content.fileBuffer
        if (!hasBuffer) {
          processedParams = JSON.stringify(params)
        }
        // 如果有 fileBuffer，保持原样传递
      }
      
      ipc
        .invoke(url, processedParams)
        .then((res) => {
          resolve(res)
        })
        .catch((err) => {
          reject(err)
        })
    } catch (error) {
      reject(error)
    }
  })
}
```

---

## 关键技术点说明

### 1. ArrayBuffer vs Buffer

- **渲染进程**：使用 `FileReader.readAsArrayBuffer()` 读取为 `ArrayBuffer`
- **IPC 传输**：Electron 自动将 `ArrayBuffer` 转换为 Node.js `Buffer`
- **主进程**：接收到的是 `Buffer` 对象，可直接写文件

### 2. 临时文件处理

主进程创建临时文件原因：
- `wukongimjstcpsdk` 的 SDK 可能需要文件路径或文件流
- 上传完成后可选择删除或保留（用于缓存）

### 3. 文件大小限制

- Electron IPC 默认消息大小限制：**128MB**
- 建议在前端压缩图片（已有 `compressUploadImage` 工具）
- 超大文件建议使用方案 D（先上传获取 URL）

### 4. 错误处理

- 文件读取失败：提示用户重新选择
- IPC 传输失败：检查文件大小是否超限
- 上传失败：主进程返回错误，前端重试机制

---

## 测试要点

1. **选择图片发送**：测试不同大小和格式的图片
2. **粘贴图片发送**：测试从剪贴板粘贴图片
3. **大文件场景**：测试 5MB 以上图片
4. **错误场景**：测试文件读取失败、网络失败等
5. **性能测试**：测试多张图片连续发送

---

## 优化建议

### 短期优化
1. 添加文件读取进度提示
2. 添加上传进度显示
3. 添加图片压缩选项

### 长期优化
1. 考虑实现方案 D（渲染进程直接上传）
2. 实现上传队列和重试机制
3. 实现图片缓存机制，避免重复上传

---

## 注意事项

1. **修改前备份**：建议先备份 `model.js`, `ChatInput.vue`, `chat.js`, `wkim.js`
2. **渐进式实现**：先实现选择图片功能，再实现粘贴功能
3. **日志输出**：保留关键步骤的日志，便于调试
4. **兼容性**：确保修改不影响 Web 环境的图片发送功能

---

## 相关文件清单

- ✏️ `frontend/src/wksdk/model.js` - ImageContent 类
- ✏️ `frontend/src/components/chat/ChatInput.vue` - 文件读取逻辑
- ✏️ `frontend/src/stores/modules/chat.js` - IPC 数据准备
- ✏️ `frontend/src/utils/icp/ipcRoute.js` - IPC 传输处理
- ✏️ `electron/service/wkim.js` - 主进程消息发送

---

**开发时间估计**：2-4 小时  
**测试时间估计**：1-2 小时

