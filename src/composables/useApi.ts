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
        // Remove token
        useCookie('accessToken').value = null
        useCookie('userData').value = null
      }

      return ctx
    },
  },
})
