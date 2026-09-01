import { useConfigStore } from '@core/stores/config'
import { createFetch } from '@vueuse/core'
import { destr } from 'destr'
import { reportFrontendError } from '@/utils/frontendErrorLogger'

const configStore = useConfigStore()

type FetchLogContext = {
  url?: string
  options?: RequestInit
}

export const useApi = createFetch({
  baseUrl: import.meta.env.VITE_API_BASE_URL || '/api',
  fetchOptions: {
    headers: {
      Accept: 'application/json',
    },
  },
  options: {
    refetch: true,
    async beforeFetch(ctx) {
      const { options } = ctx
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
      const fetchLogContext = ctx as typeof ctx & FetchLogContext

      reportFrontendError({
        type: 'api_error',
        message: ctx.error?.message || ctx.response?.statusText || 'API request failed',
        api_url: ctx.response?.url || fetchLogContext.url,
        api_method: fetchLogContext.options?.method?.toString().toUpperCase(),
        api_status: status,
        api_request_body: fetchLogContext.options?.body,
        api_response: ctx.data,
        stack: ctx.error?.stack,
      })

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
  {
    reportFrontendError({
      type: 'download_error',
      message: `Download failed with status ${response.status}`,
      api_url: response.url,
      api_method: 'GET',
      api_status: response.status,
      api_response: await response.clone().text().catch(() => null),
    })

    throw new Error('Download failed')
  }

  const blob = await response.blob()

  const link = document.createElement('a')
  link.href = window.URL.createObjectURL(blob)
  link.download = filename
  link.click()

  window.URL.revokeObjectURL(link.href)
}
