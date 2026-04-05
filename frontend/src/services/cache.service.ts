const CACHE_PREFIX = "pharmacy_cache_"
const DEFAULT_EXPIRY = 24 * 60 * 60 * 1000 // 24 hours

export const cacheService = {
  set: (key: string, data: any, expiry: number = DEFAULT_EXPIRY) => {
    try {
      const item = {
        data,
        expiry: Date.now() + expiry,
      }
      localStorage.setItem(`${CACHE_PREFIX}${key}`, JSON.stringify(item))
    } catch (error) {
      console.warn("Failed to set cache for key:", key, error)
    }
  },

  get: (key: string) => {
    try {
      const itemStr = localStorage.getItem(`${CACHE_PREFIX}${key}`)
      if (!itemStr) return null

      const item = JSON.parse(itemStr)
      if (Date.now() > item.expiry) {
        localStorage.removeItem(`${CACHE_PREFIX}${key}`)
        return null
      }
      return item.data
    } catch (error) {
      console.warn("Failed to get cache for key:", key, error)
      return null
    }
  },

  remove: (key: string) => {
    localStorage.removeItem(`${CACHE_PREFIX}${key}`)
  },

  clearAll: () => {
    Object.keys(localStorage)
      .filter((key) => key.startsWith(CACHE_PREFIX))
      .forEach((key) => localStorage.removeItem(key))
  },
}
