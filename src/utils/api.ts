import { ofetch } from 'ofetch'
import { router } from '../plugins/1.router/index'
const baseURL = import.meta.env.VITE_API_BASE_URL || '/api'

export const $api = ofetch.create({
  baseURL,
  async onRequest({ options }) {
    const accessToken = useCookie('accessToken').value
    if (accessToken)
      options.headers.append('Authorization', `Bearer ${accessToken}`)
  },
  onResponseError({ response }) {    
    if (response?.status === 401) {
      console.warn('Unauthorized, redirecting to login...')
      useCookie('accessToken').value = null // Remove token
      useCookie('userData').value = null
      router.push('/login')      
    }
  },
})
