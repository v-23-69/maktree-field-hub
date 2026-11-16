const BAG_KEY = 'maktree-page-memory-v1'
export const LAST_ROUTE_KEY = 'maktree-last-route'

type Bag = Record<string, unknown>

function bag(): Bag {
  try {
    const raw = localStorage.getItem(BAG_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as Bag
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function saveBag(next: Bag) {
  try {
    localStorage.setItem(BAG_KEY, JSON.stringify(next))
  } catch {
    /* ignore quota */
  }
}

export function readPageMemory<T>(key: string): T | null {
  const value = bag()[key]
  return value == null ? null : (value as T)
}

export function writePageMemory(key: string, value: unknown) {
  const next = bag()
  next[key] = value
  saveBag(next)
}

export function clearPageMemory(key: string) {
  const next = bag()
  if (!(key in next)) return
  delete next[key]
  saveBag(next)
}

export function readLastRoute(): string | null {
  try {
    const route = localStorage.getItem(LAST_ROUTE_KEY)
    if (!route || !route.startsWith('/') || route.startsWith('//')) return null
    if (route === '/' || route.startsWith('/login')) return null
    return route
  } catch {
    return null
  }
}

export function writeLastRoute(route: string) {
  try {
    if (!route.startsWith('/') || route === '/' || route.startsWith('/login')) return
    localStorage.setItem(LAST_ROUTE_KEY, route)
  } catch {
    /* ignore */
  }
}

export function clearLastRoute() {
  try {
    localStorage.removeItem(LAST_ROUTE_KEY)
  } catch {
    /* ignore */
  }
}
