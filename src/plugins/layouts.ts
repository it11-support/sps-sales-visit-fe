import type { App } from 'vue'

import { createLayouts } from '@layouts'
import { layoutConfig } from '@themeConfig'

import '@layouts/styles/index.scss'

export default function (app: App) {
  app.use(createLayouts(layoutConfig))
}
