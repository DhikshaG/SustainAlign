import { useState, useEffect, useCallback } from 'react'
import { Bell } from 'lucide-react'
import { Link } from 'react-router-dom'
import clsx from 'clsx'
import { apiFetch } from '../../lib/api'

export function NotificationBell({ className }) {
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      const res = await apiFetch('/api/notifications')
      setItems(res.data?.notifications || [])
      setUnreadCount(res.data?.unreadCount ?? 0)
    } catch {
      setItems([])
      setUnreadCount(0)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const res = await apiFetch('/api/notifications')
        if (!active) return
        setItems(res.data?.notifications || [])
        setUnreadCount(res.data?.unreadCount ?? 0)
      } catch {
        if (!active) return
        setItems([])
        setUnreadCount(0)
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => { active = false }
  }, [])

  async function markRead(id) {
    await apiFetch(`/api/notifications/${id}/read`, { method: 'PATCH' })
    await load()
  }

  async function markAllRead() {
    await apiFetch('/api/notifications/read-all', { method: 'PATCH' })
    await load()
  }

  return (
    <div className={clsx('relative', className)}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="relative p-2 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden />
          <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-auto bg-white rounded-lg shadow-lg border border-slate-200 z-50">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
              <span className="font-semibold text-sm text-slate-900">Notifications</span>
              {unreadCount > 0 && (
                <button type="button" onClick={markAllRead} className="text-xs text-primary-600 hover:underline">
                  Mark all read
                </button>
              )}
            </div>
            {loading && <p className="px-4 py-6 text-sm text-slate-500">Loading…</p>}
            {!loading && items.length === 0 && (
              <p className="px-4 py-6 text-sm text-slate-500">No notifications</p>
            )}
            <ul className="divide-y divide-slate-100">
              {items.map((n) => (
                <li key={n.id} className={clsx('px-4 py-3', !n.readAt && 'bg-primary-50/50')}>
                  <p className="text-sm font-medium text-slate-900">{n.title}</p>
                  <p className="text-xs text-slate-600 mt-0.5 line-clamp-2">{n.body}</p>
                  <div className="flex gap-2 mt-2">
                    {n.link && (
                      <Link to={n.link} className="text-xs text-primary-600 hover:underline" onClick={() => setOpen(false)}>
                        View
                      </Link>
                    )}
                    {!n.readAt && (
                      <button type="button" onClick={() => markRead(n.id)} className="text-xs text-slate-500 hover:underline">
                        Mark read
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  )
}
