import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { env } from './config/env.js'
import { requestLogger } from './middleware/request-logger.js'
import { errorHandler } from './middleware/error-handler.js'
import apiRoutes from './routes/index.js'

export function createApp() {
  const app = express()

  app.use(helmet())
  app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }))
  app.use(express.json())
  app.use(requestLogger())

  app.use('/api', apiRoutes)

  app.use(errorHandler)

  return app
}
