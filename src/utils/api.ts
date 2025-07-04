import { ofetch } from 'ofetch'

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
      useCookie('accessToken').value = null
      useCookie('userData').value = null
    }
  },
})
