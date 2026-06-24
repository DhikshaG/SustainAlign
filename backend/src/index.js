import './db/index.js'
import { createApp } from './server.js'
import { env } from './config/env.js'
import { startComplianceScheduler, stopComplianceScheduler } from './services/compliance/scheduler.js'
import { closeDb } from './db/index.js'

const app = createApp()

const server = app.listen(env.PORT, () => {
  console.log(`SustainAlign API listening on http://localhost:${env.PORT}`)
})

const schedulerHandle = startComplianceScheduler(env.COMPLIANCE_SYNC_INTERVAL_MINUTES)

function shutdown(signal) {
  console.log(`\n${signal} received — shutting down gracefully`)
  stopComplianceScheduler(schedulerHandle)
  server.close(() => {
    closeDb()
    console.log('Server stopped')
    process.exit(0)
  })
  setTimeout(() => process.exit(1), 10_000).unref()
}

process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT', () => shutdown('SIGINT'))
