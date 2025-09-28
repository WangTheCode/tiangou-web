'use strict';

const { logger } = require('ee-core/log');
const http = require('http');
const https = require('https');
const { URL } = require('url');

/**
 * 发起 HTTP 请求
 * @param {string} url - 请求地址
 * @param {Object} [options]
 * @param {('GET'|'POST'|'PUT'|'PATCH'|'DELETE')} [options.method]
 * @param {Object} [options.headers]
 * @param {any} [options.data] - 请求体（对象会自动 JSON 序列化）
 * @param {number} [options.timeout=10000] - 超时时间（毫秒）
 * @param {('json'|'text'|'buffer'|'auto')} [options.responseType='auto']
 * @returns {Promise<{ status:number, headers:Object, data:any }>} 返回响应
 */
function request(url, options = {}) {
  const {
    method = 'GET',
    headers = {},
    data,
    timeout = 10000,
    responseType = 'auto'
  } = options;

  if (!url || typeof url !== 'string') {
    throw new Error('request(url, options) 需要有效的 url 字符串');
  }

  const urlObj = new URL(url);
  const isHttps = urlObj.protocol === 'https:';

  const agent = isHttps
    ? new https.Agent({ keepAlive: true })
    : new http.Agent({ keepAlive: true });

  const requestOptions = {
    protocol: urlObj.protocol,
    hostname: urlObj.hostname,
    port: urlObj.port || (isHttps ? 443 : 80),
    path: urlObj.pathname + urlObj.search,
    method: String(method || 'GET').toUpperCase(),
    headers: { ...headers },
    agent
  };

  let bodyBuffer = null;
  if (typeof data !== 'undefined' && data !== null) {
    if (Buffer.isBuffer(data)) {
      bodyBuffer = data;
    } else if (typeof data === 'string') {
      bodyBuffer = Buffer.from(data, 'utf8');
      if (!requestOptions.headers['Content-Type']) {
        requestOptions.headers['Content-Type'] = 'text/plain; charset=utf-8';
      }
    } else {
      // 默认按 JSON 发送
      bodyBuffer = Buffer.from(JSON.stringify(data), 'utf8');
      if (!requestOptions.headers['Content-Type']) {
        requestOptions.headers['Content-Type'] = 'application/json; charset=utf-8';
      }
    }
    requestOptions.headers['Content-Length'] = Buffer.byteLength(bodyBuffer);
  }

  const transport = isHttps ? https : http;

  return new Promise((resolve, reject) => {
    const req = transport.request(requestOptions, (res) => {
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => {
        const buffer = Buffer.concat(chunks);
        const contentType = String(res.headers['content-type'] || '');

        let parsed = buffer;
        try {
          if (responseType === 'buffer') {
            parsed = buffer;
          } else if (responseType === 'text') {
            parsed = buffer.toString('utf8');
          } else if (responseType === 'json' || (responseType === 'auto' && contentType.includes('application/json'))) {
            parsed = buffer.length ? JSON.parse(buffer.toString('utf8')) : null;
          } else if (responseType === 'auto') {
            // 默认按文本返回
            parsed = buffer.toString('utf8');
          }
        } catch (err) {
          // JSON 解析失败时，保留原始文本
          parsed = buffer.toString('utf8');
        }

        const result = {
          status: res.statusCode || 0,
          headers: res.headers,
          data: parsed
        };

        if ((res.statusCode || 0) >= 200 && (res.statusCode || 0) < 300) {
          resolve(result);
        } else {
          const error = new Error(`HTTP ${res.statusCode}: ${urlObj.pathname}`);
          error.response = result;
          reject(error);
        }
      });
    });

    req.setTimeout(timeout, () => {
      req.destroy(new Error(`请求超时(${timeout}ms): ${urlObj.hostname}`));
    });

    req.on('error', (err) => {
      logger && logger.error ? logger.error('HTTP请求错误', { url, method, err: String(err) }) : null;
      reject(err);
    });

    if (bodyBuffer) {
      req.write(bodyBuffer);
    }
    req.end();
  });
}

function get(url, options = {}) {
  return request(url, { ...options, method: 'GET' });
}

function post(url, data, options = {}) {
  return request(url, { ...options, method: 'POST', data });
}

function put(url, data, options = {}) {
  return request(url, { ...options, method: 'PUT', data });
}

function del(url, options = {}) {
  return request(url, { ...options, method: 'DELETE' });
}

module.exports = {
  request,
  get,
  post,
  put,
  del
};


