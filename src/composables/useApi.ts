import { useConfigStore } from '@core/stores/config'
import { createFetch } from '@vueuse/core'
import { destr } from 'destr'

const configStore = useConfigStore()

export const useApi = createFetch({
  baseUrl: import.meta.env.VITE_API_BASE_URL || '/api',
  fetchOptions: {
    headers: {
      Accept: 'application/json',
    },
  },
  options: {
    refetch: true,
    async beforeFetch({ options }) {
      configStore.loading = true
      const accessToken = useCookie('accessToken').value

      if (accessToken) {
        options.headers = {
          ...options.headers,
          Authorization: `Bearer ${accessToken}`,
        }
      }

      return { options }
    },
    afterFetch(ctx) {
      configStore.loading = false
      const { data, response } = ctx

      // Parse data if it's JSON

      let parsedData = null
      try {
        parsedData = destr(data)
      }
      catch (error) {
        console.error(error)
      }

      return { data: parsedData, response }
    },
    onFetchError(ctx) {
      configStore.loading = false
      const status = ctx.response?.status

      if (status === 401) {
        console.warn('Unauthorized, redirecting to login...')
        useCookie('accessToken').value = null
        useCookie('userData').value = null
        window.location.href = '/login'
      }

      return ctx
    },
  },
})

export const downloadApi = async(url: string, filename: string) => {
  const accessToken = useCookie('accessToken').value

  const response = await fetch(
    `${import.meta.env.VITE_API_BASE_URL || '/api'}${url}`,
    {
      method: 'GET',
      headers: {
        Accept: 'application/octet-stream',
        ...(accessToken && {
          Authorization: `Bearer ${accessToken}`,
        }),
      },
    },
  )

  if (!response.ok)
    throw new Error('Download failed')

  const blob = await response.blob()

  const link = document.createElement('a')
  link.href = window.URL.createObjectURL(blob)
  link.download = filename
  link.click()

  window.URL.revokeObjectURL(link.href)
}
