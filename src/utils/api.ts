import { ofetch } from 'ofetch'

const baseURL = import.meta.env.VITE_API_BASE_URL || '/api'

console.log('baseURL', import.meta.env)
export const $api = ofetch.create({
  baseURL,
  async onRequest({ options }) {
    const accessToken = useCookie('accessToken').value
    if (accessToken)
      options.headers.append('Authorization', `Bearer ${accessToken}`)
  },
})
