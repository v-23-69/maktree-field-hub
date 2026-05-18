/** Display value for a non-negative quantity field (allows typing "0"). */
export function quantityInputDisplay(value: number | undefined): string {
  if (value === undefined || Number.isNaN(value)) return ''
  return String(value)
}

/** Parse quantity from input; empty string keeps previous value while editing. */
export function parseQuantityInput(raw: string, fallback: number): number {
  const trimmed = raw.trim()
  if (trimmed === '') return fallback
  const n = parseInt(trimmed, 10)
  if (Number.isNaN(n) || n < 0) return fallback
  return n
}
