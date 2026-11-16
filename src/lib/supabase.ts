import { createClient, type SupportedStorage } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

function safeStorage(): SupportedStorage {
  const memory = new Map<string, string>()
  let area: Storage | null = null
  try {
    const probe = '__maktree_storage_probe__'
    localStorage.setItem(probe, '1')
    localStorage.removeItem(probe)
    area = localStorage
  } catch {
    area = null
  }
  return {
    getItem: key => {
      try {
        return area?.getItem(key) ?? memory.get(key) ?? null
      } catch {
        return memory.get(key) ?? null
      }
    },
    setItem: (key, value) => {
      memory.set(key, value)
      try {
        area?.setItem(key, value)
      } catch {
        /* storage can be blocked in this browser context */
      }
    },
    removeItem: key => {
      memory.delete(key)
      try {
        area?.removeItem(key)
      } catch {
        /* ignore */
      }
    },
  }
}

let authChain: Promise<unknown> = Promise.resolve()

// Create client only when env vars are available; otherwise null (auth disabled)
export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        // HashRouter uses window.location.hash for routes; parsing it as an
        // OAuth callback can drop a valid session right after login.
        detectSessionInUrl: false,
        storage: safeStorage(),
        // The browser lock can throw "Access to storage is not allowed" and
        // leave the refresh request without a token.
        lock: async (_name, _acquireTimeout, fn) => {
          const run = authChain.then(fn, fn)
          authChain = run.then(() => undefined, () => undefined)
          return await run
        },
      },
    })
  : null
