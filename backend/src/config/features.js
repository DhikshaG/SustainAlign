import { env } from './env.js'

const featureDefaults = {
  AI_ENABLED: true,
  EMAIL_ENABLED: true,
  COMPLIANCE_SCHEDULER: true,
  ANALYTICS: true,
  STORAGE_S3: false,
}

function envValue(key) {
  const envKey = `FEATURE_${key}`
  const val = process.env[envKey] ?? featureDefaults[key]
  if (typeof val === 'string') {
    if (val === 'true' || val === '1') return true
    if (val === 'false' || val === '0') return false
  }
  return Boolean(val)
}

const features = {}
for (const key of Object.keys(featureDefaults)) {
  features[key] = envValue(key)
}

export function isFeatureEnabled(name) {
  const featureKey = name.toUpperCase().replace(/[^A-Z0-9_]/g, '_')
  return features[featureKey] === true
}

export function getFeatureStatus(name) {
  const featureKey = name.toUpperCase().replace(/[^A-Z0-9_]/g, '_')
  return {
    name: featureKey,
    enabled: features[featureKey] === true,
    defaultValue: featureDefaults[featureKey],
  }
}

export function getAllFeatureStatuses() {
  return Object.keys(features).map((key) => ({
    name: key,
    enabled: features[key],
    defaultValue: featureDefaults[key],
  }))
}

export default features
