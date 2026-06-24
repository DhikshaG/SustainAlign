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

  app.set('trust proxy', 1)
  app.use(helmet())
  app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }))
  app.use(express.json())
  app.use(requestLogger())

  app.use('/api', apiRateLimit)
  app.use('/api', apiRoutes)

  // Unmatched /api routes → clean 404 (JSON, not HTML)
  app.use('/api', notFound)
  app.use(errorHandler)

  return app
}
