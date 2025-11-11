import { isToday } from './helpers'

export const avatarText = (value: string) => {
  if (!value)
    return ''
  const nameArray = value.split(' ')

  return nameArray.map(word => word.charAt(0).toUpperCase()).join('')
}

// TODO: Try to implement this: https://twitter.com/fireship_dev/status/1565424801216311297
export const kFormatter = (num: number) => {
  const regex = /\B(?=(\d{3})+(?!\d))/g

  return Math.abs(num) > 9999 ? `${Math.sign(num) * +((Math.abs(num) / 1000).toFixed(1))}k` : Math.abs(num).toFixed(0).replace(regex, ',')
}

/**
 * Format and return date in Humanize format
 * Intl docs: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/format
 * Intl Constructor: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/DateTimeFormat
 * @param {string} value date to format
 * @param {Intl.DateTimeFormatOptions} formatting Intl object to format with
 */
export const formatDate = (
  value: string | Date,
  withTime: boolean = false,
  formatting: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }
) => {
  if (!value) return ''

  const options: Intl.DateTimeFormatOptions = { ...formatting }

  if (withTime) {
    options.hour = '2-digit'
    options.minute = '2-digit'
    options.hour12 = false
  }

  return new Intl.DateTimeFormat('en-US', options).format(new Date(value))
}

export const formatFullDateWithSuffix = (
  value: string | Date,
  withTime = false
): string => {
  if (!value) return ''

  const date = new Date(value)

  const weekday = date.toLocaleDateString('en-US', { weekday: 'long' })
  const day = date.getDate()
  const month = date.toLocaleDateString('en-US', { month: 'long' })
  const year = date.getFullYear()

  const getOrdinalSuffix = (n: number): string => {
    if (n >= 11 && n <= 13) return `${n}th`
    switch (n % 10) {
      case 1: return `${n}st`
      case 2: return `${n}nd`
      case 3: return `${n}rd`
      default: return `${n}th`
    }
  }

  const dayWithSuffix = getOrdinalSuffix(day)

  let result = `${weekday}, ${dayWithSuffix} ${month} ${year}`

  if (withTime) {
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    result += ` ${hours}:${minutes}`
  }

  return result
}



/**
 * Return short human friendly month representation of date
 * Can also convert date to only time if date is of today (Better UX)
 * @param {string} value date to format
 * @param {boolean} toTimeForCurrentDay Shall convert to time if day is today/current
 */
export const formatDateToMonthShort = (
  value: string,
  toTimeForCurrentDay = true,
  isLong = false
) => {
  const date = new Date(value)
  let formatting: Intl.DateTimeFormatOptions = {}

  if (toTimeForCurrentDay && isToday(date)) {
    formatting = { hour: 'numeric', minute: 'numeric' }
  } else {
    formatting = { month: isLong ? 'long' : 'short' }
  }

  return new Intl.DateTimeFormat('en-US', formatting).format(date)
}


export const prefixWithPlus = (value: number) => value > 0 ? `+${value}` : value
