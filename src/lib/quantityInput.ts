/** Display value for a quantity field; empty when unset (user can clear and retype). */
export function quantityInputDisplay(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return ''
  return String(value)
}

/** Parse typed quantity; empty string → null (not 0). */
export function parseQuantityInput(raw: string): number | null {
  const trimmed = raw.trim()
  if (trimmed === '') return null
  const n = parseInt(trimmed, 10)
  if (Number.isNaN(n) || n < 0) return null
  return n
}

/** Restore form state from draft/API (0 is valid; missing → null). */
export function coerceQuantity(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null
  const n = typeof value === 'number' ? value : parseInt(String(value), 10)
  if (Number.isNaN(n) || n < 0) return null
  return n
}

export function isQuantityFilled(value: number | null | undefined): value is number {
  return value !== null && value !== undefined && !Number.isNaN(value)
}
