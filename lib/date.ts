export function parseAppDate(value: unknown): Date {
  if (value instanceof Date) return value
  if (typeof value !== 'string' || !value) return new Date(0)

  // Supabase can return timestamp strings without timezone (e.g. 2026-02-27T21:27:54).
  // Treat those as UTC to avoid a 7-hour shift on clients in GMT+7.
  const hasTimezone = /[zZ]|[+-]\d{2}:\d{2}$/.test(value)
  return new Date(hasTimezone ? value : `${value}Z`)
}

export function localDateKey(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

