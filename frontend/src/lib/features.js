import { apiFetch } from './api'

let cachedFeatures = null

export async function fetchFeatures(force = false) {
  if (cachedFeatures && !force) return cachedFeatures
  try {
    const data = await apiFetch('/api/features')
    cachedFeatures = data.features || []
    return cachedFeatures
  } catch {
    cachedFeatures = []
    return cachedFeatures
  }
}

export function isFeatureEnabled(name, features = cachedFeatures) {
  if (!features) return true
  const feature = features.find((f) => f.name === name)
  return feature ? feature.enabled : true
}

export function clearFeatureCache() {
  cachedFeatures = null
}
