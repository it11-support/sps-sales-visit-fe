import { ofetch } from 'ofetch'
import { router } from '../plugins/1.router/index'
import { reportFrontendError } from './frontendErrorLogger'
const baseURL = import.meta.env.VITE_API_BASE_URL || '/api'

export const $api = ofetch.create({
  baseURL,
  async onRequest({ options }) {
    const accessToken = useCookie('accessToken').value
    if (accessToken)
      options.headers.append('Authorization', `Bearer ${accessToken}`)
  },
  onResponseError({ request, options, response }) {
    reportFrontendError({
      type: 'api_error',
      message: response?._data?.message || response?.statusText || 'API request failed',
      api_url: typeof request === 'string' ? request : response?.url,
      api_method: options?.method?.toString().toUpperCase(),
      api_status: response?.status,
      api_request_body: options?.body,
      api_response: response?._data,
    })

    if (response?.status === 401) {
      console.warn('Unauthorized, redirecting to login...')
      useCookie('accessToken').value = null // Remove token
      useCookie('userData').value = null
      router.push('/login')      
    }
  },
})
