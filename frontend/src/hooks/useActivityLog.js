import { useState, useEffect, useCallback } from 'react'
import { apiFetch } from '../lib/api'

export function useActivityLog(initialFilters = {}) {
  const [activity, setActivity] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filters, setFilters] = useState(initialFilters)

  const load = useCallback(async (override = {}) => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ ...filters, ...override })
      Object.keys(Object.fromEntries(params)).forEach((k) => {
        if (!params.get(k)) params.delete(k)
      })
      const path = initialFilters.admin
        ? `/api/admin/activity?${params}`
        : `/api/activity?${params}`
      const res = await apiFetch(path)
      setActivity(res.data?.activity || [])
    } catch (err) {
      setError(err.message)
      setActivity([])
    } finally {
      setLoading(false)
    }
  }, [filters, initialFilters.admin])

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const params = new URLSearchParams(filters)
        Object.keys(Object.fromEntries(params)).forEach((k) => {
          if (!params.get(k)) params.delete(k)
        })
        const path = initialFilters.admin
          ? `/api/admin/activity?${params}`
          : `/api/activity?${params}`
        const res = await apiFetch(path)
        if (active) setActivity(res.data?.activity || [])
      } catch (err) {
        if (active) {
          setError(err.message)
          setActivity([])
        }
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => { active = false }
  }, [filters, initialFilters.admin])

  return { activity, loading, error, filters, setFilters, reload: load }
}
