import { Router } from 'express'
import swaggerUi from 'swagger-ui-express'
import YAML from 'yaml'
import { generateSpec } from './index.js'

const router = Router()

router.get('/openapi.json', (_req, res) => {
  const spec = generateSpec()
  res.json(spec)
})

router.get('/openapi.yaml', (_req, res) => {
  const spec = generateSpec()
  res.type('yaml').send(YAML.stringify(spec))
})

const swaggerHtml = swaggerUi.generateHTML(() => generateSpec(), {
  explorer: true,
  customSiteTitle: 'SustainAlign API Docs',
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    filter: true,
  },
})

router.get('/', (_req, res) => {
  res.send(swaggerHtml)
})

export default router
