export const createStorage = ({ prefixKey = '', storage = localStorage }) => {
  const WebStorage = class WebStorage {
    constructor() {
      this.prefixKey = prefixKey
      this.storage = storage
    }
    getKey(key) {
      return `${this.prefixKey}${key}`.toUpperCase()
    }
    /**
     *
     * @param {string} key
     * @param {*} value
     * @param {number} expire  Expiration time in seconds
     * @memberof Cache
     */
    set(key, value, expire = null) {
      const stringData = JSON.stringify({
        value,
        time: Date.now(),
        expire: expire ? new Date().getTime() + expire * 1000 : null,
      })

      this.storage.setItem(this.getKey(key), stringData)
    }
    get(key, def = null) {
      const val = this.storage.getItem(this.getKey(key))
      if (!val) return def

      try {
        const data = JSON.parse(val)
        const { value, expire } = data
        if (!expire || expire >= new Date().getTime()) {
          return value
        }
        this.remove(key)
      } catch (e) {
        console.error(e)
        return def
      }
    }
    remove(key) {
      this.storage.removeItem(this.getKey(key))
    }
  }
  return new WebStorage()
}
