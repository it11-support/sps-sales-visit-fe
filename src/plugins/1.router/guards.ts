import type { Router } from 'vue-router'

export const setupGuards = (router: Router) => {
  router.beforeEach((to) => {
    if (to.meta.public)
      return true

    const isLoggedIn = Boolean(
      useCookie('userData').value &&
      useCookie('accessToken').value,
    )

    if (to.meta.unauthenticatedOnly) {
      return isLoggedIn
        ? { path: '/' }
        : true
    }

    if (!isLoggedIn) {
      return {
        name: 'login',
        query: {
          ...to.query,
          to: to.fullPath !== '/' ? to.fullPath : undefined,
        },
      }
    }

    return true
  })
}
