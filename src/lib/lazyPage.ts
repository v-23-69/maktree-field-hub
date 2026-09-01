import { lazy, type ComponentType } from 'react'

const RETRY_DELAY_MS = 700
const MAX_RETRIES = 3

/** Lazy route import with retries — helps flaky mobile WebView chunk loads. */
export function lazyPage<T extends ComponentType<unknown>>(
  factory: () => Promise<{ default: T }>,
) {
  return lazy(async () => {
    let lastError: unknown
    for (let attempt = 0; attempt < MAX_RETRIES; attempt += 1) {
      try {
        return await factory()
      } catch (error) {
        lastError = error
        if (attempt < MAX_RETRIES - 1) {
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS * (attempt + 1)))
        }
      }
    }
    throw lastError
  })
}
