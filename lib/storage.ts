const USER_ID_KEY = 'ap_physics_user_id'
const API_KEY_KEY = 'ap_physics_api_key'

export const StorageService = {
  userId: {
    get(): string | null {
      if (typeof window === 'undefined') return null
      return localStorage.getItem(USER_ID_KEY)
    },
    init(): string {
      const existing = localStorage.getItem(USER_ID_KEY)
      if (existing) return existing
      const id = crypto.randomUUID()
      localStorage.setItem(USER_ID_KEY, id)
      return id
    },
  },
  apiKey: {
    get(): string | null {
      if (typeof window === 'undefined') return null
      return localStorage.getItem(API_KEY_KEY)
    },
    save(key: string): void {
      localStorage.setItem(API_KEY_KEY, key)
    },
    clear(): void {
      localStorage.removeItem(API_KEY_KEY)
    },
  },
}
