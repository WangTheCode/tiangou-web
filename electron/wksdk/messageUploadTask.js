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
      const ossUploaded = await this.uploadViaOSS(filePath, objectKey)
      if (ossUploaded) {
        logger.info('OSS 直传成功')
        return
      }

      // 降级：使用后端 API 上传
      logger.info('OSS 直传失败或不可用，降级使用后端 API 上传')
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
          this.update()
        },
        cancelToken: new axios.CancelToken(c => {
          this.canceler = c
        }),
      })

      if (absoluteUrl) {
        const mediaContent = this.message.content
        mediaContent.remoteUrl = absoluteUrl
        this.status = TaskStatus.success
        this.update()

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
      console.warn('OSS 直传失败:', error.message || error)
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
          this.update()
        },
        cancelToken: new axios.CancelToken(c => {
          this.canceler = c // 支持取消上传
        }),
      })

      if (resp && resp.data && resp.data.path) {
        const mediaContent = this.message.content
        mediaContent.remoteUrl = resp.data.path
        this.status = TaskStatus.success
        this.update()

        // 上传成功后删除临时文件
        try {
          fs.unlinkSync(filePath)
          logger.info('临时文件已删除:', filePath)
        } catch (err) {
          console.warn('删除临时文件失败:', err)
        }
      }
    } catch (error) {
      logger.info('文件上传失败！->', error)
      this.status = TaskStatus.fail
      this.update()
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
