import { useEffect, useState, useCallback } from 'react'

const DEFAULT_INTERVAL = Number(import.meta.env.VITE_IMPACT_POLL_INTERVAL_MS) || 30000

export function useImpactPolling(fetchFn, intervalMs = DEFAULT_INTERVAL) {
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      const result = await fetchFn()
      setData(result)
      setLastUpdated(new Date())
      setError(null)
    } catch (err) {
      setError(err.message || 'Failed to load impact data')
    } finally {
      setLoading(false)
    }
  }, [fetchFn])

  useEffect(() => {
    let cancelled = false

    async function poll() {
      try {
        const result = await fetchFn()
        if (cancelled) return
        setData(result)
        setLastUpdated(new Date())
        setError(null)
      } catch (err) {
        if (cancelled) return
        setError(err.message || 'Failed to load impact data')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    poll()
    const id = setInterval(poll, intervalMs)
    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [fetchFn, intervalMs])

  return { data, error, loading, lastUpdated, refresh }
}
