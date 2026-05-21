import { useState, useEffect, useRef } from 'react'
import { Search } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import clsx from 'clsx'
import { apiFetch } from '../../lib/api'

const TYPE_LABELS = {
  ngo: 'NGOs',
  project: 'Projects',
  report: 'Reports',
  location: 'Locations',
  sdg: 'SDGs',
}

export function GlobalSearch({ className, placeholder = 'Search NGOs, projects, reports...' }) {
  const [q, setQ] = useState('')
  const [results, setResults] = useState([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const ref = useRef(null)

  useEffect(() => {
    if (q.trim().length < 2) return undefined
    let active = true
    const t = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await apiFetch(`/api/search?q=${encodeURIComponent(q.trim())}`)
        if (active) {
          setResults(res.data?.results || [])
          setOpen(true)
        }
      } catch {
        if (active) setResults([])
      } finally {
        if (active) setLoading(false)
      }
    }, 300)
    return () => {
      active = false
      clearTimeout(t)
    }
  }, [q])

  useEffect(() => {
    function onDocClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [])

  const grouped = results.reduce((acc, r) => {
    const key = r.type || 'other'
    if (!acc[key]) acc[key] = []
    acc[key].push(r)
    return acc
  }, {})

  function go(href) {
    setOpen(false)
    setQ('')
    setResults([])
    navigate(href)
  }

  const showDropdown = open && q.trim().length >= 2

  return (
    <div ref={ref} className={clsx('relative flex-1 max-w-md', className)}>
      <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
        <Search className="h-4 w-4 text-slate-400 shrink-0" />
        <input
          type="search"
          value={q}
          onChange={(e) => {
            const v = e.target.value
            setQ(v)
            if (v.trim().length < 2) {
              setResults([])
              setOpen(false)
            }
          }}
          onFocus={() => results.length && setOpen(true)}
          placeholder={placeholder}
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
          aria-label="Global search"
        />
        {loading && <span className="text-xs text-slate-400">…</span>}
      </div>
      {showDropdown && (
        <div className="absolute left-0 right-0 mt-1 max-h-80 overflow-auto bg-white rounded-lg shadow-lg border border-slate-200 z-50">
          {results.length === 0 && !loading && (
            <p className="px-4 py-3 text-sm text-slate-500">No results</p>
          )}
          {Object.entries(grouped).map(([type, items]) => (
            <div key={type}>
              <p className="px-4 py-2 text-xs font-semibold uppercase text-slate-400 bg-slate-50">
                {TYPE_LABELS[type] || type}
              </p>
              <ul>
                {items.map((r) => (
                  <li key={r.id}>
                    <button
                      type="button"
                      className="w-full text-left px-4 py-2 text-sm hover:bg-primary-50"
                      onClick={() => go(r.href)}
                    >
                      <span className="font-medium text-slate-900">{r.title}</span>
                      {r.snippet && (
                        <span className="block text-xs text-slate-500 truncate">{r.snippet}</span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
