const STORAGE_KEY = 'maktree-saved-logins'
const MAX_SAVED = 20

export type SavedLogin = {
  email: string
  password: string
  savedAt: string
}

function readRaw(): SavedLogin[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.flatMap(row => {
      if (!row || typeof row !== 'object') return []
      const email = 'email' in row && typeof row.email === 'string' ? row.email.trim() : ''
      const password = 'password' in row && typeof row.password === 'string' ? row.password : ''
      const savedAt = 'savedAt' in row && typeof row.savedAt === 'string' ? row.savedAt : ''
      if (!email || !password) return []
      return [{ email, password, savedAt }]
    })
  } catch {
    return []
  }
}

function write(rows: SavedLogin[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(rows))
}

export function readSavedLogins(): SavedLogin[] {
  return readRaw()
}

export function rememberLogin(email: string, password: string): SavedLogin[] {
  const clean = email.trim()
  const next = [
    { email: clean, password, savedAt: new Date().toISOString() },
    ...readRaw().filter(row => row.email.toLowerCase() !== clean.toLowerCase()),
  ].slice(0, MAX_SAVED)
  write(next)
  return next
}

export function forgetLogin(email: string): SavedLogin[] {
  const next = readRaw().filter(row => row.email.toLowerCase() !== email.trim().toLowerCase())
  write(next)
  return next
}
