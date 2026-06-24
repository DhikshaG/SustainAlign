import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { env } from './config/env.js'
import { requestLogger } from './middleware/request-logger.js'
import { errorHandler, notFound } from './middleware/error-handler.js'
import { apiRateLimit } from './middleware/rate-limit-auth.js'
import apiRoutes from './routes/index.js'

export function createApp() {
  const app = express()

  app.set('trust proxy', env.TRUST_PROXY)
  app.use(helmet())
  app.use(cors({ origin: env.CORS_ORIGIN, credentials: true, maxAge: 86400 }))
  app.use(express.json({ limit: '1mb' }))
  app.use(requestLogger())

  app.use('/api', apiRateLimit)
  app.use('/api', apiRoutes)

  // Unmatched /api routes → clean 404 (JSON, not HTML)
  app.use('/api', notFound)
  app.use(errorHandler)

  return app
}
