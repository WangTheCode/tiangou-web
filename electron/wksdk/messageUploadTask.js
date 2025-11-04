const fs = require('fs')
const path = require('path')
const FormData = require('form-data')
const { axiosInstance } = require('../utils/axiosInstance')
const { MessageTask, TaskStatus } = require('wukongimjstcpsdk')
const axios = require('axios')
const { uploadFileToOSS } = require('./oss')
const { logger } = require('ee-core/log')

class MediaMessageUploadTask extends MessageTask {
  constructor(message) {
    super(message)
    this._progress = 0
    this.canceler = undefined
  }

  getUUID() {
    const len = 32 // 32长度
    const radix = 16 // 16进制
    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.split('')
    const uuid = []
    for (let i = 0; i < len; i++) {
      uuid[i] = chars[0 | (Math.random() * radix)]
    }
    return uuid.join('')
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
      const fileName = this.getUUID()
      const objectKey = `${this.message.channel.channelType}/${this.message.channel.channelID}/${fileName}${mediaContent.extension || ''}`

      // 优先尝试 OSS 直传
      const isOssUploaded = await this.uploadViaOSS(filePath, objectKey)
      if (isOssUploaded) {
        logger.info('OSS 直传成功')
        return
      }

      // 降级：使用后端 API 上传
      logger.info('OSS 直传失败或不可用，降级使用后端 API 上传', isOssUploaded)
      const uploadURL = await this.getUploadURL(`/${objectKey}`)
      if (uploadURL) {
        await this.uploadFile(filePath, uploadURL)
      } else {
        logger.info('获取上传地址失败！')
        this.status = TaskStatus.fail
        this.update()
      }
    } else {
      logger.info('多媒体消息不存在附件或附件格式错误！')
      if (mediaContent.remoteUrl && mediaContent.remoteUrl !== '') {
        this.status = TaskStatus.success
        this.update()
      } else {
        this.status = TaskStatus.fail
        this.update()
      }
    }
  }

  /**
   * 优先尝试 OSS 直传
   * @param {string} filePath - 文件路径
   * @param {string} objectKey - 对象 key
   * @returns {Promise<boolean>} 是否成功
   */
  async uploadViaOSS(filePath, objectKey) {
    try {
      logger.info('开始 OSS 直传:', filePath)

      const absoluteUrl = await uploadFileToOSS(filePath, {
        objectKey,
        fileName: path.basename(filePath),
        contentType: this.getContentType(filePath),
        onProgress: (loaded, total) => {
          const completeProgress = (loaded / total) | 0
          this._progress = completeProgress
          logger.info('uploadViaOSS progress----->', completeProgress)
          // 注意：不在进度回调中调用 update()，避免 content 被序列化后报错
        },
        cancelToken: new axios.CancelToken(c => {
          this.canceler = c
        }),
      })

      logger.info('uploadViaOSS absoluteUrl----->', absoluteUrl)
      if (absoluteUrl) {
        this.message.content.remoteUrl = absoluteUrl
        this.status = TaskStatus.success

        // 关键修复：不调用 this.update()，因为 SDK 已经将 content 序列化为普通对象
        // this.update() 会导致 SDK 内部调用 content.encode()，但此时 content 已失去原型方法
        logger.info('OSS 直传成功，remoteUrl 已设置:', absoluteUrl)

        // 上传成功后删除临时文件
        try {
          fs.unlinkSync(filePath)
          logger.info('临时文件已删除:', filePath)
        } catch (err) {
          console.warn('删除临时文件失败:', err)
        }

        return true
      }
    } catch (error) {
      // 改用 logger.error 以便记录到日志文件
      logger.error('OSS 直传失败:', error.message || error)
      return false
    }
  }

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
          // 不在进度回调中调用 update()，避免 content 被序列化后报错
        },
        cancelToken: new axios.CancelToken(c => {
          this.canceler = c // 支持取消上传
        }),
      })

      if (resp && resp.data && resp.data.path) {
        this.message.content.remoteUrl = resp.data.path
        this.status = TaskStatus.success
        // 不调用 this.update()，避免 encode is not a function 错误
        logger.info('后端上传成功，remoteUrl 已设置:', resp.data.path)

        // 上传成功后删除临时文件
        try {
          fs.unlinkSync(filePath)
          logger.info('临时文件已删除:', filePath)
        } catch (err) {
          console.warn('删除临时文件失败:', err)
        }
      }
    } catch (error) {
      logger.error('文件上传失败！->', error)
      this.status = TaskStatus.fail
      // 不调用 this.update()，避免 encode is not a function 错误
    }
  }

  // 获取上传路径（使用共享的 axiosInstance）
  async getUploadURL(path) {
    try {
      // 使用 axiosInstance，自动带上 baseURL 和 token
      const result = await axiosInstance.get('file/upload', {
        params: { path, type: 'chat' },
      })
      if (result && result.data) {
        return result.data.url
      }
    } catch (error) {
      console.error('获取上传 URL 失败:', error)
    }
  }

  suspend() {
    // 暂停上传（预留）
  }

  resume() {
    // 恢复上传（预留）
  }

  cancel() {
    this.status = TaskStatus.cancel
    if (this.canceler) {
      this.canceler()
    }
    this.update()
  }

  progress() {
    return this._progress || 0
  }
}

module.exports = {
  MediaMessageUploadTask,
}
