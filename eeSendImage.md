# Electron 环境图片消息发送方案 - ArrayBuffer 传输（优化版）

## 方案概述

**核心思路**：

1. 渲染进程将 File 对象读取为 ArrayBuffer，通过 IPC 传递
2. 主进程接收 Buffer，写入临时文件
3. 创建 ImageContent 并设置 `file` 字段为临时文件路径
4. **SDK 自动调用 `MediaMessageUploadTask` 上传文件**（无需手动上传）

**关键优化**：利用 SDK 的 `messageUploadTaskCallback` 机制，自动处理文件上传。

---

## 实现步骤

### 第一步：修改 `ImageContent` 类

**文件**：`frontend/src/wksdk/model.js`

```javascript
export class ImageContent extends MediaMessageContent {
  constructor(file, imgData, width, height) {
    super()
    this.file = file // File 对象（仅 Web 环境使用）
    this.imgData = imgData // base64 预览数据
    this.width = width || 0
    this.height = height || 0

    // 新增：用于 Electron IPC 传输的字段
    this.fileBuffer = null // ArrayBuffer 数据
    this.fileName = file?.name // 文件名
    this.fileType = file?.type // MIME 类型
    this.fileSize = file?.size // 文件大小
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
      url: this.remoteUrl || '',
    }
  }

  // 新增：准备 IPC 传输的数据
  toIPCData() {
    return {
      contentType: this.contentType,
      width: this.width,
      height: this.height,
      imgData: this.imgData,
      fileBuffer: this.fileBuffer, // ArrayBuffer 会被自动转为 Buffer
      fileName: this.fileName,
      fileType: this.fileType,
      fileSize: this.fileSize,
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
const handleImageChange = async event => {
  const file = event.target.files?.[0]
  if (!file) return

  console.log('选择图片:', file)

  sendFileDialog({
    file: file,
    onSubmit: async imgObj => {
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
const readFileAsArrayBuffer = file => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = e => {
      resolve(e.target.result) // ArrayBuffer
    }
    reader.onerror = e => {
      reject(e)
    }
    reader.readAsArrayBuffer(file)
  })
}

// 处理粘贴的图片
const handlePasteImage = async file => {
  console.log('粘贴图片:', file)

  sendFileDialog({
    file: file,
    onSubmit: async imgObj => {
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

### 第四步：修改 Electron 主进程 - 创建临时文件并设置 file 字段

**文件**：`electron/service/wkim.js`

**关键变化**：不需要手动上传，只需设置 `file` 字段，SDK 会自动调用 `MediaMessageUploadTask` 上传！

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
      constructor(width, height, file, fileName, fileType) {
        super()
        this.width = width
        this.height = height
        this.file = file           // 文件路径（Node.js 环境）
        this.fileName = fileName   // 文件名
        this.fileType = fileType   // MIME 类型

        // 提取文件扩展名（SDK 上传需要）
        if (fileName) {
          const extMatch = fileName.match(/\.([^.]+)$/)
          this.extension = extMatch ? extMatch[0] : ''
        }
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

    // 从 Buffer 重建临时文件
    try {
      if (content.fileBuffer) {
        // 将 Buffer 写入临时文件
        const buffer = Buffer.from(content.fileBuffer)
        const tempDir = os.tmpdir()
        const fileName = content.fileName || `image_${Date.now()}.png`
        const tempFilePath = path.join(tempDir, fileName)

        fs.writeFileSync(tempFilePath, buffer)
        logger.info(`临时文件已创建: ${tempFilePath}, 大小: ${buffer.length} bytes`)

        // 创建 ImageContent 实例
        // 重要：设置 file 为临时文件路径，SDK 会自动调用 MediaMessageUploadTask 上传
        messageContent = new ImageContent(
          content.width,
          content.height,
          tempFilePath,      // file 字段
          content.fileName,
          content.fileType
        )

        logger.info('ImageContent 已创建，SDK 将自动上传文件')
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
    // 发送消息（SDK 会自动触发 MediaMessageUploadTask 上传文件）
    const message = await this.sdk.chatManager.send(messageContent, channel, setting)

    logger.info('消息发送成功，图片已上传')
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
        .then(res => {
          resolve(res)
        })
        .catch(err => {
          reject(err)
        })
    } catch (error) {
      reject(error)
    }
  })
}
```

---

### 第六步（新增）：适配 Node.js 环境的 MediaMessageUploadTask

**文件**：`electron/wksdk/messageUploadTask.js`

**当前问题**：该文件是从 TS Web 项目拷贝的，需要适配 Node.js 环境：

1. `FormData` 在 Node.js 中不存在，需要使用 `form-data` 包
2. `File` 对象需要从文件路径读取
3. `axios` 需要正确配置 multipart/form-data
4. **重要**：复用项目的 HTTP 配置（baseUrl、token），而不是独立配置

**架构设计**：

```
wkim.js (setImConfig)
    ↓ 配置同步
axiosInstance.js (共享 axios 实例)
    ↓ 使用
messageUploadTask.js (文件上传)
```

---

### 第六步-1：创建共享的 Axios 实例

**新建文件**：`electron/utils/axiosInstance.js`

```javascript
const axios = require('axios')
const { logger } = require('ee-core/log')

// 创建 axios 实例（单例模式）
const axiosInstance = axios.create({
  timeout: 60000, // 上传超时 60s
})

// 请求拦截器：添加日志
axiosInstance.interceptors.request.use(
  config => {
    logger.info('Axios 请求:', {
      method: config.method,
      url: config.url,
      headers: config.headers,
    })
    return config
  },
  error => {
    logger.error('Axios 请求错误:', error)
    return Promise.reject(error)
  }
)

// 响应拦截器：统一错误处理
axiosInstance.interceptors.response.use(
  response => {
    logger.info('Axios 响应:', {
      status: response.status,
      url: response.config.url,
    })
    return response
  },
  error => {
    logger.error('Axios 响应错误:', {
      url: error.config?.url,
      status: error.response?.status,
      message: error.message,
    })
    return Promise.reject(error)
  }
)

/**
 * 设置 axios 全局配置
 * @param {Object} options
 * @param {string} options.baseUrl - 基础URL
 * @param {Object} options.headers - 请求头（如 token）
 */
function setAxiosConfig(options = {}) {
  if (options.baseUrl) {
    axiosInstance.defaults.baseURL = options.baseUrl
    logger.info('Axios baseURL 已更新:', options.baseUrl)
  }

  if (options.headers && typeof options.headers === 'object') {
    // 合并 headers，保留现有配置
    axiosInstance.defaults.headers.common = {
      ...axiosInstance.defaults.headers.common,
      ...options.headers,
    }
    logger.info('Axios headers 已更新:', options.headers)
  }
}

/**
 * 获取当前配置
 */
function getAxiosConfig() {
  return {
    baseURL: axiosInstance.defaults.baseURL,
    headers: { ...axiosInstance.defaults.headers.common },
  }
}

module.exports = {
  axiosInstance,
  setAxiosConfig,
  getAxiosConfig,
}
```

---

### 第六步-2：在 wkim.js 中同步配置

**修改文件**：`electron/service/wkim.js`

```javascript
const { setHttpOption } = require('../utils/http')
const { setAxiosConfig } = require('../utils/axiosInstance')  // 新增

async connectTcp(args) {
  // ... 现有代码 ...

  const httpConfig = {
    baseUrl: this.imConfig.api_addr,
    headers: {
      token: this.userInfo.token,
    },
  }

  // 同时配置项目 HTTP 和 axios
  setHttpOption(httpConfig)
  setAxiosConfig(httpConfig)  // 新增：同步配置给 axios

  // ... 现有代码 ...
}
```

---

### 第六步-3：修改 MessageUploadTask 使用共享实例

**需要修改的关键代码**：

```javascript
const fs = require('fs')
const path = require('path')
const FormData = require('form-data') // 需要安装: npm install form-data
const { axiosInstance } = require('../utils/axiosInstance') // 使用共享的 axios 实例
const { MessageTask, TaskStatus } = require('wukongimjstcpsdk')

class MediaMessageUploadTask extends MessageTask {
  // ... 其他代码保持不变 ...

  async uploadFile(filePath, uploadURL) {
    // Node.js 环境：从文件路径创建 FormData
    const formData = new FormData()

    // 创建文件读取流
    const fileStream = fs.createReadStream(filePath)
    formData.append('file', fileStream, {
      filename: path.basename(filePath),
      contentType: this.getContentType(filePath),
    })

    try {
      // 使用共享的 axiosInstance（自动带上 baseURL 和 token）
      const resp = await axiosInstance.post(uploadURL, formData, {
        headers: {
          ...formData.getHeaders(), // 重要：获取正确的 Content-Type boundary
        },
        onUploadProgress: e => {
          const completeProgress = (e.loaded / e.total) | 0
          this._progress = completeProgress
          this.update()
        },
        cancelToken: new axiosInstance.CancelToken(c => {
          this.canceler = c // 支持取消上传
        }),
      })

      if (resp && resp.data && resp.data.path) {
        const mediaContent = this.message.content
        mediaContent.remoteUrl = resp.data.path
        this.status = TaskStatus.success
        this.update()

        // 上传成功后删除临时文件（可选）
        try {
          fs.unlinkSync(filePath)
          console.log('临时文件已删除:', filePath)
        } catch (err) {
          console.warn('删除临时文件失败:', err)
        }
      }
    } catch (error) {
      console.log('文件上传失败！->', error)
      this.status = TaskStatus.fail
      this.update()
    }
  }

  // 获取文件的 Content-Type
  getContentType(filePath) {
    const ext = path.extname(filePath).toLowerCase()
    const mimeTypes = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.bmp': 'image/bmp',
    }
    return mimeTypes[ext] || 'application/octet-stream'
  }

  async start() {
    const mediaContent = this.message.content

    // Node.js 环境：file 是文件路径字符串
    if (mediaContent.file && typeof mediaContent.file === 'string') {
      const filePath = mediaContent.file
      const fileName = path.basename(filePath)
      const objectKey = `${this.message.channel.channelType}/${this.message.channel.channelID}/${this.getUUID()}${mediaContent.extension || ''}`

      // 获取上传 URL
      const uploadURL = await this.getUploadURL(`/${objectKey}`)
      if (uploadURL) {
        await this.uploadFile(filePath, uploadURL)
      } else {
        console.log('获取上传地址失败！')
        this.status = TaskStatus.fail
        this.update()
      }
    } else {
      console.log('多媒体消息不存在附件或附件格式错误！')
      if (mediaContent.remoteUrl && mediaContent.remoteUrl !== '') {
        this.status = TaskStatus.success
        this.update()
      } else {
        this.status = TaskStatus.fail
        this.update()
      }
    }
  }

  // 获取上传路径（使用共享的 axiosInstance）
  async getUploadURL(path) {
    try {
      // 使用 axiosInstance，自动带上 baseURL 和 token
      const result = await axiosInstance.get(`file/upload`, {
        params: { path, type: 'chat' },
      })
      if (result && result.data) {
        return result.data.url
      }
    } catch (error) {
      console.error('获取上传 URL 失败:', error)
    }
  }
}

module.exports = {
  MediaMessageUploadTask,
}
```

**需要安装的依赖**：

```bash
cd electron
npm install form-data axios
```

---

### 第六步-4：配置流程说明

**配置同步流程**：

```
1. 用户登录
   ↓
2. wkim.connectTcp() 获取 API 地址和 token
   ↓
3. 同时调用：
   - setHttpOption({ baseUrl, headers: { token } })    // 项目 HTTP
   - setAxiosConfig({ baseUrl, headers: { token } })   // axios 实例
   ↓
4. messageUploadTask 使用 axiosInstance
   - 自动带上 baseURL（无需写完整 URL）
   - 自动带上 token（无需手动添加）
   ↓
5. 上传请求：axiosInstance.post('file/upload', formData)
   实际请求：POST https://api.example.com/file/upload
             Authorization: Bearer xxx
```

**优势**：

- ✅ 统一配置管理
- ✅ 自动同步 token（登录后自动生效）
- ✅ 支持上传进度和取消
- ✅ 完整的日志和错误处理

---

## 关键技术点说明

### 1. ArrayBuffer vs Buffer

- **渲染进程**：使用 `FileReader.readAsArrayBuffer()` 读取为 `ArrayBuffer`
- **IPC 传输**：Electron 自动将 `ArrayBuffer` 转换为 Node.js `Buffer`
- **主进程**：接收到的是 `Buffer` 对象，可直接写文件

### 2. SDK 上传机制

**重要**：`wukongimjstcpsdk` 在发送消息时会自动：

1. 检查 `messageContent.file` 是否存在
2. 如果存在，调用 `config.provider.messageUploadTaskCallback` 获取上传任务
3. 执行任务的 `start()` 方法上传文件
4. 上传成功后设置 `messageContent.remoteUrl`
5. 发送包含 `remoteUrl` 的消息到服务器

**优势**：无需在 `wkim.js` 中手动实现上传逻辑！

### 3. 临时文件处理

主进程创建临时文件原因：

- Node.js 环境需要文件路径来创建 `ReadStream`
- 上传完成后可自动删除临时文件

### 4. 文件大小限制

- Electron IPC 默认消息大小限制：**128MB**
- 建议在前端压缩图片（已有 `compressUploadImage` 工具）
- 超大文件建议使用方案 D（先上传获取 URL）

### 5. 错误处理

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

## 架构流程图

```
渲染进程 (Web)                    IPC                   主进程 (Electron)
┌─────────────────┐                               ┌────────────────────┐
│ 1. 用户选择图片  │                               │                    │
│    File 对象    │                               │                    │
└────────┬────────┘                               │                    │
         │                                        │                    │
         ▼                                        │                    │
┌─────────────────┐                               │                    │
│ 2. 读取为       │                               │                    │
│  ArrayBuffer    │                               │                    │
└────────┬────────┘                               │                    │
         │                                        │                    │
         ▼                                        │                    │
┌─────────────────┐                               │                    │
│ 3. 创建         │                               │                    │
│  ImageContent   │                               │                    │
│  (含 buffer)    │                               │                    │
└────────┬────────┘                               │                    │
         │                                        │                    │
         ▼                                        │                    │
┌─────────────────┐          invoke              ┌┴───────────────────┐
│ 4. IPC 发送     ├──────────────────────────────>│ 5. 接收 Buffer     │
│  sendMessage    │     (ArrayBuffer -> Buffer)   │                    │
└─────────────────┘                               └┬───────────────────┘
                                                   │
                                                   ▼
                                          ┌────────────────────┐
                                          │ 6. 写临时文件       │
                                          │   /tmp/image.png   │
                                          └┬───────────────────┘
                                           │
                                           ▼
                                          ┌────────────────────┐
                                          │ 7. 创建            │
                                          │  ImageContent      │
                                          │  file='/tmp/...'   │
                                          └┬───────────────────┘
                                           │
                                           ▼
                                          ┌────────────────────┐
                                          │ 8. SDK.send()      │
                                          │  自动触发上传任务   │
                                          └┬───────────────────┘
                                           │
                                           ▼
                                          ┌────────────────────┐
                                          │ 9. UploadTask      │
                                          │  - 读取文件        │
                                          │  - FormData上传    │
                                          │  - 设置remoteUrl   │
                                          └┬───────────────────┘
                                           │
                                           ▼
                                          ┌────────────────────┐
                                          │ 10. 发送消息       │
                                          │   (含remoteUrl)    │
                                          └────────────────────┘
```

---

## 相关文件清单

### **需要修改的文件**

- ✏️ `frontend/src/wksdk/model.js` - ImageContent 类（添加 toIPCData 方法）
- ✏️ `frontend/src/components/chat/ChatInput.vue` - 文件读取为 ArrayBuffer
- ✏️ `frontend/src/stores/modules/chat.js` - IPC 数据序列化
- ✏️ `frontend/src/utils/icp/ipcRoute.js` - IPC 传输处理（支持 Buffer）
- ✏️ `electron/service/wkim.js` - 主进程创建 ImageContent + 同步 axios 配置
- ✏️ `electron/wksdk/messageUploadTask.js` - **关键！适配 Node.js 文件上传**

### **需要新建的文件**

- 🆕 `electron/utils/axiosInstance.js` - **新增！共享 axios 实例和配置管理**

### **无需修改的文件**

- ✅ `electron/wksdk/setCallback.js` - 已配置 messageUploadTaskCallback

---

---

## 方案优势对比

### ✅ 优化后的方案（当前）

**优点**：

- 利用 SDK 自动上传机制，代码更简洁
- 上传逻辑集中在 `MediaMessageUploadTask`，易维护
- 支持上传进度回调
- 自动清理临时文件
- 与 Web 环境逻辑一致

**实现复杂度**：中等

- 需要适配 `messageUploadTask.js` 到 Node.js 环境
- 需要安装 `form-data` 和 `axios` 依赖

### ❌ 原方案（手动上传）

**缺点**：

- 需要在 `wkim.js` 中重复实现上传逻辑
- 无法利用 SDK 的上传进度、重试等功能
- 代码冗余，维护成本高

---

## 依赖安装

**Electron 主进程需要安装**：

```bash
cd electron
npm install form-data axios
```

**或添加到 `electron/package.json`**：

```json
{
  "dependencies": {
    "form-data": "^4.0.0",
    "axios": "^1.6.0"
  }
}
```

---

## 配置同步机制说明

### **为什么需要 axiosInstance.js？**

**问题**：

- 项目使用 `electron/utils/http.js` 管理 HTTP 配置（baseUrl、token）
- messageUploadTask 使用 axios 上传文件
- 需要两者配置保持同步

**解决方案**：

1. 创建 `axiosInstance.js` 作为 axios 的配置中心
2. 在 `wkim.js` 的 `connectTcp()` 中同时配置两者
3. messageUploadTask 使用共享实例，自动获得配置

**代码示例**：

```javascript
// electron/service/wkim.js
async connectTcp(args) {
  const config = {
    baseUrl: this.imConfig.api_addr,
    headers: { token: this.userInfo.token }
  }

  setHttpOption(config)    // 配置项目 HTTP
  setAxiosConfig(config)   // 配置 axios（同步）
}
```

**效果**：

```javascript
// messageUploadTask.js
// ✅ 无需手动指定完整 URL
await axiosInstance.get('file/upload', { params: { path, type: 'chat' } })
// 实际请求：GET https://api.example.com/file/upload?path=xxx&type=chat
//           headers: { token: 'xxx' }

// ✅ 无需手动添加 token
await axiosInstance.post(uploadURL, formData)
// 自动带上 token header
```

---

**开发时间估计**：2-3 小时  
**测试时间估计**：1-2 小时
