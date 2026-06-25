import { useState, useEffect } from 'react'
import { fetchFeatures, isFeatureEnabled, clearFeatureCache } from '../lib/features'

export function useFeatureFlags() {
  const [features, setFeatures] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    setLoading(true)
    fetchFeatures()
      .then((data) => {
        if (mounted) {
          setFeatures(data)
          setLoading(false)
        }
      })
      .catch(() => {
        if (mounted) {
          setFeatures([])
          setLoading(false)
        }
      })
    return () => {
      mounted = false
    }
  }, [])

  return {
    features,
    loading,
    isEnabled: (name) => isFeatureEnabled(name, features),
    refresh: () => {
      clearFeatureCache()
      setLoading(true)
      fetchFeatures(true)
        .then(setFeatures)
        .finally(() => setLoading(false))
    },
  }
}
