import './db/index.js'
import { createApp } from './server.js'
import { env } from './config/env.js'
import { startComplianceScheduler } from './services/compliance/scheduler.js'

const app = createApp()

app.listen(env.PORT, () => {
  console.log(`SustainAlign API listening on http://localhost:${env.PORT}`)
  startComplianceScheduler(env.COMPLIANCE_SYNC_INTERVAL_MINUTES)
})
