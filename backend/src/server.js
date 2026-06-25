import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { env } from './config/env.js'
import { requestId } from './middleware/request-id.js'
import { errorHandler, notFound } from './middleware/error-handler.js'
import { apiRateLimit } from './middleware/rate-limit-auth.js'
import apiRoutes from './routes/index.js'
import healthRoutes from './routes/health.js'
import { createRequestLogger } from './lib/logger.js'
import { metricsMiddleware, metricsRoute, isMetricsEnabled } from './lib/metrics.js'
import { initSentry, getSentryRequestHandler, getSentryErrorHandler } from './lib/sentry.js'

const sentryEnabled = await initSentry()

const API_V1 = '/api/v1'
const API_LEGACY = '/api'

export function createApp() {
  const app = express()

  app.set('trust proxy', env.TRUST_PROXY)

  const sentryReqHandler = getSentryRequestHandler()
  if (sentryReqHandler) {
    app.use(sentryReqHandler)
  }

  app.use(helmet())
  app.use(cors({ origin: env.CORS_ORIGIN, credentials: true, maxAge: 86400 }))
  app.use(express.json({ limit: '1mb' }))
  app.use(requestId())
  app.use(createRequestLogger())

  if (isMetricsEnabled()) {
    app.use(metricsMiddleware)
    app.get('/metrics', metricsRoute)
  }

  const mountRoutes = (prefix) => {
    app.use(prefix, healthRoutes)
    app.use(prefix, apiRateLimit)
    app.use(prefix, apiRoutes)
    app.use(prefix, notFound)
  }

  mountRoutes(API_V1)
  mountRoutes(API_LEGACY)

  const sentryErrHandler = getSentryErrorHandler()
  if (sentryErrHandler) {
    app.use(sentryErrHandler)
  }

  app.use(errorHandler)

  return app
}
