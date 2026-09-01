import { createApp } from 'vue'

import App from '@/App.vue'
import { registerPlugins } from '@core/utils/plugins'
import { installFrontendErrorHandlers } from './utils/frontendErrorLogger'

// Styles
import '@core/scss/template/index.scss'
import '@styles/styles.scss'

// Create vue app
const app = createApp(App)

installFrontendErrorHandlers(app)

// Register plugins
registerPlugins(app)

// Mount vue app
app.mount('#app')
