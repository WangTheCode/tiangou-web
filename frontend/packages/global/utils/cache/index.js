import { createStorage } from './webStorage'

const createOptions = (storage) => {
  let prefixKey = import.meta.env.VITE_CACHE_PREFIX || ''

  return {
    storage,
    prefixKey: prefixKey,
  }
}

export const WebStorage = createStorage(createOptions(sessionStorage))
export default WebStorage
