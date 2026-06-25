import pino from 'pino'
import pinoHttp from 'pino-http'
import { env } from '../config/env.js'

const level = env.LOG_LEVEL || 'info'

export const logger = pino({
  level,
  transport:
    env.NODE_ENV === 'development' && level === 'debug' ? { target: 'pino/file', options: { level } } : undefined,
  redact: {
    paths: ['req.headers.authorization', 'req.headers.cookie', 'body.password', 'body.token'],
    censor: '[REDACTED]',
  },
  serializers: {
    req: (r) => ({ method: r.method, url: r.url, path: r.path, requestId: r.id }),
    res: (r) => ({ statusCode: r.statusCode }),
    err: pino.stdSerializers.err,
  },
  formatters: {
    level(label) {
      return { level: label }
    },
  },
  timestamp: pino.stdTimeFunctions.isoTime,
})

export function createRequestLogger() {
  return pinoHttp({
    logger,
    autoLogging: {
      ignore(req) {
        return req.url === '/api/health'
      },
    },
    customReceivedMessage(req) {
      return `← ${req.method} ${req.url}`
    },
    customSuccessMessage(req, res) {
      return `→ ${res.statusCode} ${req.method} ${req.url}`
    },
    customErrorMessage(req, res, err) {
      return `✗ ${res.statusCode} ${req.method} ${req.url} ${err?.message || ''}`
    },
  })
}
