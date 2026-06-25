import { isFeatureEnabled, getAllFeatureStatuses } from '../config/features.js'

export function requireFeature(featureName) {
  return (req, res, next) => {
    if (!isFeatureEnabled(featureName)) {
      return res.status(503).json({
        error: 'Feature disabled',
        feature: featureName,
        status: 'disabled',
        message: `${featureName} is not currently available`,
      })
    }
    next()
  }
}

export function featureStatusRoute(_req, res) {
  res.json({ features: getAllFeatureStatuses() })
}
