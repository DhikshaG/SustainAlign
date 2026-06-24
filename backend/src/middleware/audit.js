import { logMutation } from '../services/activity-log/index.js'

/**
 * Log a mutation after a successful handler.
 * Usage: await auditMutation(req, { action, entityType, entityId, before, after, reason })
 */
export async function auditMutation(req, { action, entityType, entityId, before, after, reason }) {
  return logMutation({ req, action, entityType, entityId, before, after, reason })
}
