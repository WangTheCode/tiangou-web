// 基于 ali-oss 的阿里云 OSS 直传工具
// 说明：
// - 通过后端 /file/oss/sts 获取临时凭证（STS）
// - 使用 ali-oss 生成预签名 PUT URL（signatureUrl），配合 axios 发送，支持进度/取消
// - 返回可访问的绝对 URL，兼容 Electron 渲染进程与浏览器

import axios from 'axios'
import OSS from 'ali-oss'
import chatApi from '@/api/chat'

// STS 返回的常见字段集合（兼容多种后端命名）
// STSLike 对象包含以下可能的字段：
// - 基本鉴权: accessKeyId, access_key_id, accessId, OSSAccessKeyId
// - 密钥: accessKeySecret, access_key_secret
// - Token: stsToken, securityToken, security_token, x-oss-security-token
// - 资源位置: region, ossRegion, endpoint, bucket, bucketName
// - 上传路径前缀: upload_path, dir, prefix
// - 直链/加速域名: bucket_url, baseUrl, cdn
// - 过期时间: expire, expiration

/**
 * 规范化 region（若传入 cn-xxx 则补全为 oss-cn-xxx）
 * @param {string} region - 区域代码
 * @returns {string|undefined}
 */
function normalizeRegion(region) {
  if (!region) return undefined
  if (region.startsWith('oss-')) return region
  return `oss-${region}`
}

/**
 * 生成上传使用的 host（POST 提交地址）
 * @param {Object} sts - STS 配置对象
 * @returns {string}
 * @private 暂未使用，保留供将来扩展
 */
// eslint-disable-next-line no-unused-vars
function buildUploadHost(sts) {
  const bucket = sts.bucket || sts.bucketName || ''
  const endpoint = (sts.endpoint || '').replace(/^https?:\/\//i, '')
  const regionRaw = sts.region || sts.ossRegion

  if (endpoint) {
    // endpoint 存在：
    // - 如果是官方域名（包含 aliyuncs.com），走 bucket.endpoint
    // - 否则视为 CNAME 自定义域名，直接使用 endpoint
    if (/aliyuncs\.com$/i.test(endpoint)) {
      return `https://${bucket}.${endpoint}`
    }
    return `https://${endpoint}`
  }

  // 根据 region 拼接
  const region = normalizeRegion(regionRaw)
  if (bucket && region) {
    return `https://${bucket}.${region}.aliyuncs.com`
  }
  throw new Error('无效的 STS：缺少 endpoint 或 region/bucket')
}

/**
 * 生成最终可访问直链前缀（优先后端给的自定义）
 * @param {Object} sts - STS 配置对象
 * @returns {string}
 */
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

/**
 * 从 STS 中提取上传前缀（目录）
 * @param {Object} sts - STS 配置对象
 * @returns {string}
 */
function extractPrefix(sts) {
  const raw = (sts.upload_path || sts.dir || sts.prefix || 'chat').replace(/^\/+|\/+$/g, '')
  return raw || 'chat'
}

/**
 * 生成随机文件名（32位16进制）
 * @returns {string}
 */
function randomHex32() {
  const chars = '0123456789abcdef'
  let out = ''
  for (let i = 0; i < 32; i++) out += chars[(Math.random() * 16) | 0]
  return out
}

/**
 * 将绝对/相对 path 规范化为不以 / 开头
 * @param {string} path - 路径
 * @returns {string}
 */
function normalizeKeyPath(path) {
  return path.replace(/^\/+/, '')
}

/**
 * 通过后端 /file/oss/sts 获取临时授权
 * @returns {Promise<Object>}
 */
async function fetchSTS() {
  const sts = await chatApi.getOssSts()
  return sts || {}
}

// OssUploadOptions 对象说明：
// - objectKey: 指定最终对象 key（会拼在 sts 目录后），例如："chat/1/uid/xxx.png" 或 "1/uid/xxx.png"
//              若未传，则默认：`${prefix}/${random}.${ext}`
// - onProgress: 进度回调函数 (loaded, total) => void
// - maxSize: 覆盖最大体积（默认 100MB）
// - cancelToken: 可选取消 token（axios CancelToken）

// client 简单缓存，避免重复创建
let cachedClient = null
let cachedClientKey = ''

/**
 * 生成客户端缓存 key
 * @param {Object} sts - STS 配置对象
 * @returns {string}
 */
function makeClientKey(sts) {
  const bucket = sts.bucket || sts.bucketName || ''
  const ep = sts.endpoint || ''
  const region = sts.region || sts.ossRegion || ''
  const ak = sts.accessKeyId || sts.access_key_id || sts.accessId || sts.OSSAccessKeyId || ''
  const token =
    sts.stsToken || sts.securityToken || sts.security_token || sts['x-oss-security-token'] || ''
  return [bucket, ep, region, ak, token].join('|')
}

/**
 * 构建 OSS 客户端配置选项
 * @param {Object} sts - STS 配置对象
 * @returns {Object}
 */
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

/**
 * 获取 OSS 客户端实例（带缓存）
 * @param {Object} sts - STS 配置对象
 * @returns {Object}
 */
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
 * @param {File} file - 文件对象
 * @param {Object} opts - 上传选项
 * @param {string} opts.objectKey - 指定最终对象 key
 * @param {Function} opts.onProgress - 进度回调
 * @param {number} opts.maxSize - 最大体积
 * @param {any} opts.cancelToken - 取消 token
 * @returns {Promise<string>} 可访问的绝对 URL
 */
export async function uploadFileToOSS(file, opts = {}) {
  const sts = await fetchSTS()
  const client = getClient(sts)

  const prefix = extractPrefix(sts)
  // 生成最终 key（不能以 / 开头）
  let key
  if (opts.objectKey && opts.objectKey.trim() !== '') {
    key = normalizeKeyPath(`${prefix}/${normalizeKeyPath(opts.objectKey)}`)
  } else {
    const name = file.name || 'file'
    const ext = (name.split('.').pop() || 'bin').toLowerCase()
    key = normalizeKeyPath(`${prefix}/${randomHex32()}.${ext}`)
  }

  // 生成预签名 PUT URL（STS token 会自动附加在 query）
  const signedUrl = client.signatureUrl(key, {
    method: 'PUT',
    expires: 3600,
    'Content-Type': file.type || 'application/octet-stream',
  })

  // 通过 axios 发送（支持上传进度与取消）
  await axios.put(signedUrl, file, {
    headers: { 'Content-Type': file.type || 'application/octet-stream' },
    onUploadProgress: (evt) => {
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
}
