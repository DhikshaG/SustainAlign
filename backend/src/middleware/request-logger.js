import morgan from 'morgan'
import { env } from '../config/env.js'

export function requestLogger() {
  if (env.NODE_ENV === 'production') {
    return (req, res, next) => {
      const start = Date.now()
      res.on('finish', () => {
        console.log(JSON.stringify({
          requestId: req.id,
          method: req.method,
          path: req.path,
          status: res.statusCode,
          durationMs: Date.now() - start,
        }))
      })
      next()
    }
  }
  return morgan('dev')
}
