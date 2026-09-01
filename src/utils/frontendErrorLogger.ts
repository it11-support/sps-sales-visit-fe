type FrontendErrorPayload = {
  type?: string
  message?: string
  file?: string
  line?: number
  column?: number
  stack?: string
  frontend_url?: string
  api_url?: string
  api_method?: string
  api_status?: number
  api_request_body?: unknown
  api_response?: unknown
  component?: string
  user?: unknown
  app_version?: string
}

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '/api'
const frontendErrorEndpoint = `${apiBaseUrl.replace(/\/$/, '')}/frontend-errors`
const maxSerializedLength = 4000

let isReporting = false

const serialize = (value: unknown, seen = new WeakSet<object>()): unknown => {
  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message,
      stack: value.stack,
    }
  }

  if (value === null || typeof value !== 'object')
    return value

  if (seen.has(value))
    return '[Circular]'

  seen.add(value)

  if (Array.isArray(value))
    return value.map(item => serialize(item, seen))

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, item]) => [key, serialize(item, seen)]),
  )
}

const truncate = (value: unknown): unknown => {
  if (typeof value !== 'string')
    return value

  return value.length > maxSerializedLength
    ? `${value.slice(0, maxSerializedLength)}...`
    : value
}

const authHeader = () => {
  const accessToken = useCookie('accessToken').value

  return accessToken ? `Bearer ${accessToken}` : null
}

const currentUser = () => {
  const userData = useCookie<Record<string, unknown> | null>('userData').value

  if (!userData || typeof userData !== 'object')
    return null

  const user = ('data' in userData && userData.data && typeof userData.data === 'object')
    ? userData.data as Record<string, unknown>
    : userData

  if (!user || typeof user !== 'object')
    return null

  return {
    id: 'id' in user ? user.id : undefined,
    name: 'name' in user ? user.name : undefined,
    username: 'username' in user ? user.username : undefined,
    email: 'email' in user ? user.email : undefined,
  }
}

const normalizePayload = (payload: FrontendErrorPayload): FrontendErrorPayload => ({
  message: String(truncate(payload.message || 'Unknown frontend error')),
  type: payload.type || 'frontend_error',
  file: typeof payload.file === 'string' ? String(truncate(payload.file)) : payload.file,
  line: payload.line,
  column: payload.column,
  stack: typeof payload.stack === 'string' ? String(truncate(payload.stack)) : payload.stack,
  frontend_url: payload.frontend_url || window.location.href,
  api_url: payload.api_url,
  api_method: payload.api_method,
  api_status: payload.api_status,
  api_request_body: serialize(payload.api_request_body),
  api_response: serialize(payload.api_response),
  component: payload.component,
  user: payload.user || currentUser(),
  app_version: import.meta.env.VITE_APP_VERSION,
})

export const reportFrontendError = (payload: FrontendErrorPayload) => {
  if (isReporting)
    return

  const body = JSON.stringify(normalizePayload(payload))

  isReporting = true

  try {
    const isSameOrigin = new URL(frontendErrorEndpoint, window.location.origin).origin === window.location.origin

    if (isSameOrigin && navigator.sendBeacon) {
      const blob = new Blob([body], { type: 'application/json' })

      if (navigator.sendBeacon(frontendErrorEndpoint, blob))
        return
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
    }

    const authorization = authHeader()

    if (authorization)
      headers.Authorization = authorization

    fetch(frontendErrorEndpoint, {
      method: 'POST',
      headers,
      body,
      credentials: 'omit',
      keepalive: true,
    }).catch(() => {})
  }
  catch (_) {
    // Error reporting must never interrupt the app.
  }
  finally {
    window.setTimeout(() => {
      isReporting = false
    }, 0)
  }
}

export const installFrontendErrorHandlers = (app: { config: { errorHandler?: (...args: any[]) => void } }) => {
  app.config.errorHandler = (error, instance, info) => {
    reportFrontendError({
      type: 'vue_error',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      component: instance?.type?.name || instance?.type?.__name || info,
    })
  }

  window.addEventListener('error', event => {
    reportFrontendError({
      type: 'javascript_error',
      message: event.message,
      file: event.filename,
      line: event.lineno,
      column: event.colno,
      stack: event.error?.stack,
    })
  })

  window.addEventListener('unhandledrejection', event => {
    const reason = event.reason

    reportFrontendError({
      type: 'unhandled_promise',
      message: reason?.message || String(reason),
      stack: reason?.stack,
      api_response: serialize(reason),
    })
  })

  const originalConsoleError = window.console.error.bind(window.console)

  window.console.error = (...args: unknown[]) => {
    originalConsoleError(...args)

    reportFrontendError({
      type: 'console_error',
      message: args.map(arg => {
        if (typeof arg === 'string')
          return arg

        if (arg instanceof Error)
          return arg.message

        return JSON.stringify(serialize(arg))
      }).join(' '),
      stack: args.find(arg => arg instanceof Error)?.stack,
      api_response: args.map(arg => serialize(arg)),
    })
  }
}
