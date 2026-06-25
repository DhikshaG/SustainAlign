import promClient from 'prom-client'
import { env } from '../config/env.js'

const register = new promClient.Registry()

promClient.collectDefaultMetrics({ register, prefix: 'sustainalign_' })

const httpRequestDuration = new promClient.Histogram({
  name: 'sustainalign_http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'path', 'status'],
  buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
  registers: [register],
})

const httpRequestsTotal = new promClient.Counter({
  name: 'sustainalign_http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'path', 'status'],
  registers: [register],
})

const dbQueryDuration = new promClient.Histogram({
  name: 'sustainalign_db_query_duration_seconds',
  help: 'Database query duration in seconds',
  labelNames: ['operation'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1],
  registers: [register],
})

const activeTenants = new promClient.Gauge({
  name: 'sustainalign_active_tenants',
  help: 'Number of active tenants',
  registers: [register],
})

export function metricsMiddleware(req, res, next) {
  const end = httpRequestDuration.startTimer()
  res.on('finish', () => {
    const path = req.route?.path || req.path || req.url
    const labels = { method: req.method, path, status: res.statusCode }
    httpRequestsTotal.inc(labels)
    end(labels)
  })
  next()
}

export function observeDbQuery(operation, fn) {
  const end = dbQueryDuration.startTimer({ operation })
  try {
    const result = fn()
    end({ operation })
    return result
  } catch (err) {
    end({ operation })
    throw err
  }
}

export function setActiveTenants(count) {
  activeTenants.set(count)
}

export async function metricsRoute(_req, res) {
  res.set('Content-Type', register.contentType)
  res.end(await register.metrics())
}

export function isMetricsEnabled() {
  const val = env.PROMETHEUS_ENABLED
  return val === true || val === 'true' || val === '1'
}
