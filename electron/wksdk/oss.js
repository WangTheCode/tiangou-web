// 基于 ali-oss 的阿里云 OSS 直传工具（Node.js 版本）
// 说明：
// - 通过后端 /file/oss/sts 获取临时凭证（STS）
// - 使用 ali-oss 生成预签名 PUT URL（signatureUrl），配合 axios 发送，支持进度/取消
// - 返回可访问的绝对 URL，兼容 Electron 主进程
// - 支持 Node.js 文件路径上传（自动读取文件内容）

const { get } = require('../utils/http')
const axios = require('axios')
const OSS = require('ali-oss')
const fs = require('fs')
const path = require('path')
const { logger } = require('ee-core/log')
// STS 返回的常见字段集合（兼容多种后端命名）
// 注释：TypeScript 类型已移除，保留说明供参考
// accessKeyId, access_key_id, accessId, OSSAccessKeyId - 基本鉴权
// accessKeySecret, access_key_secret
// stsToken, securityToken, security_token, x-oss-security-token
// region, ossRegion, endpoint - 资源位置
// bucket, bucketName
// upload_path, dir, prefix - 上传路径前缀
// bucket_url, baseUrl, cdn - 直链/加速域名
// expire, expiration - 过期时间

// 规范化 region（若传入 cn-xxx 则补全为 oss-cn-xxx）
function normalizeRegion(region) {
  if (!region) return undefined
  if (region.startsWith('oss-')) return region
  return `oss-${region}`
}

// 生成最终可访问直链前缀（优先后端给的自定义）
function buildPublicBaseUrl(sts) {
  if (sts.bucket_url) return sts.bucket_url.replace(/\/$/, '')
  if (sts.baseUrl) return sts.baseUrl.replace(/\/$/, '')
  if (sts.cdn) return sts.cdn.replace(/\/$/, '')

  // 退化到 endpoint/region 规则
  const bucket = sts.bucket || sts.bucketName || ''
  const endpoint = (sts.endpoint || '').replace(/^https?:\/\//i, '')
  if (endpoint) {
    // 若 endpoint 是自定义域名（非 aliyuncs.com），直接使用
    if (!/aliyuncs\.com$/i.test(endpoint)) {
      return `https://${endpoint}`
    }
    return `https://${bucket}.${endpoint}`
  }
  const region = normalizeRegion(sts.region || sts.ossRegion)
  if (bucket && region) {
    return `https://${bucket}.${region}.aliyuncs.com`
  }
  return ''
}

// 从 STS 中提取上传前缀（目录）
function extractPrefix(sts) {
  const raw = (sts.upload_path || sts.dir || sts.prefix || 'chat').replace(/^\/+|\/+$/g, '')
  return raw || 'chat'
}

// 生成随机文件名（32位16进制）
function randomHex32() {
  const chars = '0123456789abcdef'
  let out = ''
  for (let i = 0; i < 32; i++) out += chars[(Math.random() * 16) | 0]
  return out
}

// 将绝对/相对 path 规范化为不以 / 开头
function normalizeKeyPath(keyPath) {
  return keyPath.replace(/^\/+/, '')
}

// 通过后端 /file/oss/sts 获取临时授权
async function fetchSTS() {
  const sts = await get('file/oss/sts')
  return sts && sts.data ? sts.data : {}
}

// OssUploadOptions 参数说明：
// - objectKey: 指定最终对象 key（会拼在 sts 目录后）
// - onProgress: 进度回调 (loaded, total) => void
// - maxSize: 覆盖最大体积（默认 100MB）
// - cancelToken: axios CancelToken

// client 简单缓存，避免重复创建
let cachedClient = null
let cachedClientKey = ''

function makeClientKey(sts) {
  const bucket = sts.bucket || sts.bucketName || ''
  const ep = sts.endpoint || ''
  const region = sts.region || sts.ossRegion || ''
  const ak = sts.accessKeyId || sts.access_key_id || sts.accessId || sts.OSSAccessKeyId || ''
  const token =
    sts.stsToken || sts.securityToken || sts.security_token || sts['x-oss-security-token'] || ''
  return [bucket, ep, region, ak, token].join('|')
}

function buildClientOptions(sts) {
  const bucket = sts.bucket || sts.bucketName || ''
  const accessKeyId =
    sts.accessKeyId || sts.access_key_id || sts.accessId || sts.OSSAccessKeyId || ''
  const accessKeySecret = sts.accessKeySecret || sts.access_key_secret || ''
  const stsToken =
    sts.stsToken || sts.securityToken || sts.security_token || sts['x-oss-security-token'] || ''

  const regionRaw = sts.region || sts.ossRegion
  const opts = {
    bucket,
    accessKeyId,
    accessKeySecret,
    stsToken,
    secure: true,
  }
  if (sts.endpoint) {
    const ep = sts.endpoint.replace(/\/$/, '')
    opts.endpoint = ep
    if (!/\.aliyuncs\.com$/i.test(ep)) {
      // 自定义域名（CNAME）
      opts.cname = true
    }
  } else if (regionRaw) {
    opts.region = normalizeRegion(regionRaw)
  }
  return opts
}

function getClient(sts) {
  const key = makeClientKey(sts)
  if (cachedClient && cachedClientKey === key) return cachedClient
  const options = buildClientOptions(sts)
  cachedClient = new OSS(options)
  cachedClientKey = key
  return cachedClient
}

/**
 * 执行 OSS 直传（signatureUrl + PUT）并返回绝对 URL
 * Node.js 环境适配版本
 * @param {string|Buffer} fileOrPath - 文件路径字符串或 Buffer 对象
 * @param {Object} opts - 上传选项
 * @param {string} opts.objectKey - 指定最终对象 key
 * @param {string} opts.fileName - 文件名（用于提取扩展名）
 * @param {string} opts.contentType - MIME 类型
 * @param {function} opts.onProgress - 进度回调
 * @param {any} opts.cancelToken - axios CancelToken
 * @returns {Promise<string>} 可访问的绝对 URL
 */
async function uploadFileToOSS(fileOrPath, opts = {}) {
  const sts = await fetchSTS()
  logger.info('uploadFileToOSS sts----->', JSON.stringify(sts))
  const client = getClient(sts)

  const prefix = extractPrefix(sts)
  logger.info('uploadFileToOSS prefix----->', prefix)

  // 生成最终 key（不能以 / 开头）
  let key
  if (opts.objectKey && opts.objectKey.trim() !== '') {
    key = normalizeKeyPath(`${prefix}/${normalizeKeyPath(opts.objectKey)}`)
  } else {
    // Node.js 环境：从 opts.fileName 或文件路径提取扩展名
    const name =
      opts.fileName || (typeof fileOrPath === 'string' ? path.basename(fileOrPath) : 'file')
    const ext = (name.split('.').pop() || 'bin').toLowerCase()
    key = normalizeKeyPath(`${prefix}/${randomHex32()}.${ext}`)
  }

  // 获取 Content-Type
  const contentType = opts.contentType || 'application/octet-stream'

  // 生成预签名 PUT URL（STS token 会自动附加在 query）
  const signedUrl = client.signatureUrl(key, {
    method: 'PUT',
    expires: 3600,
    'Content-Type': contentType,
  })

  // Node.js 环境：读取文件为 Buffer
  let fileBuffer
  if (typeof fileOrPath === 'string') {
    // 文件路径 → 读取为 Buffer
    fileBuffer = fs.readFileSync(fileOrPath)
  } else if (Buffer.isBuffer(fileOrPath)) {
    // 已经是 Buffer
    fileBuffer = fileOrPath
  } else {
    throw new Error('fileOrPath 必须是文件路径字符串或 Buffer 对象')
  }
  try {
    // 通过 axios 发送（支持上传进度与取消）
    await axios.put(signedUrl, fileBuffer, {
      headers: { 'Content-Type': contentType },
      onUploadProgress: evt => {
        if (evt.total && typeof opts.onProgress === 'function') {
          try {
            opts.onProgress(evt.loaded, evt.total)
          } catch {
            /* ignore */
          }
        }
      },
      cancelToken: opts.cancelToken,
    })

    const publicBase = buildPublicBaseUrl(sts)
    const absoluteUrl = `${publicBase}/${key}`.replace(/\/$/, '')
    return absoluteUrl
  } catch (error) {
    logger.info('uploadFileToOSS error----->', error)
    throw error
  }
}

module.exports = {
  uploadFileToOSS,
}
