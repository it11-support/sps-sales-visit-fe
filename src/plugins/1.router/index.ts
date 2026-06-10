import { setupLayouts } from 'virtual:generated-layouts'
import type { App } from 'vue'

// Pindahkan semua import secara bersih ke core 'vue-router'
import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
// Ambil rute hasil generate otomatis dari modul virtual bawaan Vue Router 5
import { routes } from 'vue-router/auto-routes' 

import UnauthorizedPage from '@/layouts/components/redirects/Unauthorized.vue'
import { setupGuards } from './guards'

function recursiveLayouts(route: RouteRecordRaw): RouteRecordRaw {
  if (route.children) {
    for (let i = 0; i < route.children.length; i++)
      route.children[i] = recursiveLayouts(route.children[i])

    return route
  }
  return setupLayouts([route])[0]
}

const redirects: RouteRecordRaw[] = [
  {
    path: '/unauthorized',
    name: 'unauthorized',
    component: UnauthorizedPage,
    meta: { public: true },
  }
]

// Gabungkan rute statis (redirects) dan rute otomatis secara manual di sini
const finalRoutes = [
  ...redirects,
  ...routes.map(route => recursiveLayouts(route)),
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior(to) {
    if (to.hash)
      return { el: to.hash, behavior: 'smooth', top: 60 }
    return { top: 0 }
  },
  // Masukkan array rute yang sudah bersih di sini
  routes: finalRoutes, 
})

setupGuards(router)

export { router }

export default function (app: App) {
  app.use(router)
}
