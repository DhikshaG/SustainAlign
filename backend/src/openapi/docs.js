import { Router } from 'express'
import YAML from 'yaml'
import { generateSpec } from './index.js'

const router = Router()

let swaggerHtml = null

async function ensureSwagger() {
  if (swaggerHtml) return
  const swaggerUi = await import('swagger-ui-express')
  swaggerHtml = swaggerUi.generateHTML(() => generateSpec(), {
    explorer: true,
    customSiteTitle: 'SustainAlign API Docs',
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      filter: true,
    },
  })
}

router.get('/openapi.json', (_req, res) => {
  res.json(generateSpec())
})

router.get('/openapi.yaml', (_req, res) => {
  res.type('yaml').send(YAML.stringify(generateSpec()))
})

router.get('/', async (_req, res, next) => {
  try {
    await ensureSwagger()
    res.send(swaggerHtml)
  } catch (err) {
    next(err)
  }
})

export default router
