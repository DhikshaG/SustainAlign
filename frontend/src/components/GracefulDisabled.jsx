import { isFeatureEnabled } from '../lib/features'

export function GracefulDisabled({ feature, features, children, fallback }) {
  if (isFeatureEnabled(feature, features)) {
    return children
  }

  if (fallback) {
    return fallback
  }

  return (
    <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4 text-center text-sm text-gray-500">
      <p className="font-medium">{feature.replace(/_/g, ' ').toLowerCase()}</p>
      <p>This feature is currently disabled</p>
    </div>
  )
}
