import { generateSpec } from '../src/openapi/index.js'
import { writeFileSync } from 'fs'

const spec = generateSpec()
const info = spec.info
const baseUrl = spec.servers?.[0]?.url || '/api/v1'

const collection = {
  info: { name: info.title, description: info.description, schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json' },
  auth: { type: 'bearer', bearer: [{ key: 'token', value: '{{auth_token}}', type: 'string' }] },
  variable: [
    { key: 'base_url', value: 'http://localhost:4000', type: 'string' },
    { key: 'auth_token', value: '', type: 'string' },
  ],
  item: [],
}

for (const [path, methods] of Object.entries(spec.paths)) {
  for (const [method, def] of Object.entries(methods)) {
    if (method === 'parameters') continue
    const fullPath = baseUrl + path
    const name = def.summary || `${method.toUpperCase()} ${path}`
    const item = {
      name,
      request: {
        method: method.toUpperCase(),
        header: [{ key: 'Content-Type', value: 'application/json' }],
        url: { raw: `{{base_url}}${fullPath}`, host: ['{{base_url}}'], path: fullPath.split('/').filter(Boolean), variable: [] },
      },
    }
    const pathParams = (path.match(/\{(\w+)\}/g) || []).map(p => p.slice(1, -1))
    for (const p of pathParams) {
      item.request.url.variable.push({ key: p, value: p, type: 'string' })
    }
    collection.item.push(item)
  }
}

writeFileSync('sustainalign.postman_collection.json', JSON.stringify(collection, null, 2))
console.log(`Postman collection: ${collection.item.length} requests`)
