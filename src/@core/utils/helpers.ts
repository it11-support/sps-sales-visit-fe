// 👉 IsEmpty
export const isEmpty = (value: unknown): boolean => {
  if (value === null || value === undefined || value === '')
    return true

  return !!(Array.isArray(value) && value.length === 0)
}

// 👉 IsNullOrUndefined
export const isNullOrUndefined = (value: unknown): value is undefined | null => {
  return value === null || value === undefined
}

// 👉 IsEmptyArray
export const isEmptyArray = (arr: unknown): boolean => {
  return Array.isArray(arr) && arr.length === 0
}

// 👉 IsObject
export const isObject = (obj: unknown): obj is Record<string, unknown> =>
  obj !== null && !!obj && typeof obj === 'object' && !Array.isArray(obj)

// 👉 IsToday
export const isToday = (date: Date) => {
  const today = new Date()

  return (
    date.getDate() === today.getDate()
    && date.getMonth() === today.getMonth()
    && date.getFullYear() === today.getFullYear()
  )
}

export const formatMoney = (amount: number, short: boolean = false): string => {
  if (short && Math.abs(amount) >= 1_000_000) {
    const millions = amount / 1_000_000
    const rounded = millions % 1 === 0 ? millions.toFixed(0) : millions.toFixed(1)
    return `Rp ${rounded}M`
  }

  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount)
}
// export const formatDate = (value: string | Date, formatting: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' }) => new Intl.DateTimeFormat('en-US', formatting).format(new Date(value))
