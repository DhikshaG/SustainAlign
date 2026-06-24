import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { env } from './config/env.js'
import { requestLogger } from './middleware/request-logger.js'
import { requestId } from './middleware/request-id.js'
import { errorHandler, notFound } from './middleware/error-handler.js'
import { apiRateLimit } from './middleware/rate-limit-auth.js'
import apiRoutes from './routes/index.js'
import { sqlite } from './db/index.js'

export function createApp() {
  const app = express()

  app.set('trust proxy', env.TRUST_PROXY)
  app.use(helmet())
  app.use(cors({ origin: env.CORS_ORIGIN, credentials: true, maxAge: 86400 }))
  app.use(express.json({ limit: '1mb' }))
  app.use(requestId())
  app.use(requestLogger())

  app.get('/api/health', (_req, res) => {
    try {
      sqlite.prepare('SELECT 1').get()
      res.json({ ok: true, status: 'healthy' })
    } catch {
      res.status(503).json({ ok: false, status: 'unhealthy' })
    }
  })

  app.use('/api', apiRateLimit)
  app.use('/api', apiRoutes)

  app.use('/api', notFound)
  app.use(errorHandler)

  return app
}
