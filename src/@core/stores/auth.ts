import { AuthState, User } from '@core/types'
import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    token: null,
    user: null,
  }),

  actions: {
    setToken(token: string) {
      this.token = token
    },

    setUser(user: User) {
      this.user = user
    },

    logout() {
      this.token = null
      this.user = null
    },
  },
})
