import { logger } from './logger.js'

export function authLog(event, data = {}) {
  logger.info({ event, ...data }, 'auth event')
}
