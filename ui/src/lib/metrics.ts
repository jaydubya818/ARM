export function normalizeRate(value?: number): number | undefined {
  if (value === undefined) return undefined
  if (Number.isNaN(value)) return undefined
  return Math.abs(value) > 1 ? value / 100 : value
}
