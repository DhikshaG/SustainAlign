import { createApp } from './server.js'
import { env } from './config/env.js'

const app = createApp()

app.listen(env.PORT, () => {
  console.log(`SustainAlign API listening on http://localhost:${env.PORT}`)
})
