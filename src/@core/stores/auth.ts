import { AuthState, IUser } from '@core/types'
import { defineStore } from 'pinia'
import { useActivityStore } from './activity'
import { useCustomerStore } from './customer'
import { useUserStore } from './user'

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    token: null,
    user: null,
  }),

  actions: {
    setToken(token: string) {
      this.token = token
    },

    setUser(user: IUser) {
      this.user = user
    },

    logout() {
      this.token = null
      this.user = null
      
      // Reset store
      useActivityStore().$reset()
      useCustomerStore().$reset()
      useUserStore().$reset()
    },
  },
})
