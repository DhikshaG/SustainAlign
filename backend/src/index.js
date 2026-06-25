import './db/index.js'
import { createApp } from './server.js'
import { env } from './config/env.js'
import { logger } from './lib/logger.js'
import { startComplianceScheduler, stopComplianceScheduler } from './services/compliance/scheduler.js'
import { closeDb } from './db/index.js'

const app = createApp()

const server = app.listen(env.PORT, () => {
  logger.info({ port: env.PORT }, 'SustainAlign API listening')
})

const schedulerHandle = startComplianceScheduler(env.COMPLIANCE_SYNC_INTERVAL_MINUTES)

function shutdown(signal) {
  logger.info({ signal }, 'Shutting down gracefully')
  stopComplianceScheduler(schedulerHandle)
  server.close(() => {
    closeDb()
    logger.info('Server stopped')
    process.exit(0)
  })
  setTimeout(() => process.exit(1), 10_000).unref()
}

process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT', () => shutdown('SIGINT'))
