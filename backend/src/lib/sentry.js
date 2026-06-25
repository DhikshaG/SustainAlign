import { env } from '../config/env.js'

let sentryRequestHandler = null
let sentryErrorHandler = null

export async function initSentry() {
  if (!env.SENTRY_DSN) return false

  const Sentry = await import('@sentry/node')

  Sentry.init({
    dsn: env.SENTRY_DSN,
    environment: env.NODE_ENV,
    tracesSampleRate: env.NODE_ENV === 'production' ? 0.1 : 0,
  })

  sentryRequestHandler = Sentry.Handlers.requestHandler()
  sentryErrorHandler = Sentry.Handlers.errorHandler()

  return true
}

export function getSentryRequestHandler() {
  return sentryRequestHandler
}

export function getSentryErrorHandler() {
  return sentryErrorHandler
}
