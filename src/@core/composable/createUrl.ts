import type { MaybeRefOrGetter } from 'vue'
import { computed, toValue } from 'vue'

interface Options {
  query: MaybeRefOrGetter<Record<string, any>>
}

function stringifyQueryWithBrackets(query: Record<string, any>) {
  const parts: string[] = []

  for (const [key, maybeVal] of Object.entries(query)) {
    const val = toValue(maybeVal)

    if (val === undefined || val === null) {
      continue
    }

    if (Array.isArray(val)) {
      // untuk setiap item, tambahkan sebagai key[]
      for (const item of val) {
        const encKey = encodeURIComponent(`${key}[]`)
        const encVal = encodeURIComponent(String(toValue(item)))
        parts.push(`${encKey}=${encVal}`)
      }
    } else {
      const encKey = encodeURIComponent(key)
      const encVal = encodeURIComponent(String(val))
      parts.push(`${encKey}=${encVal}`)
    }
  }

  return parts.join('&')
}

export const createUrl = (url: MaybeRefOrGetter<string>, options?: Options) =>
  computed(() => {
    const _url = toValue(url)
    if (!options?.query) {
      return _url
    }

    const _query = toValue(options.query)
    const queryString = stringifyQueryWithBrackets(_query)

    return queryString ? `${_url}?${queryString}` : _url
  })
