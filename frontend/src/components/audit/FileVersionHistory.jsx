import { useEffect, useState } from 'react'
import { fetchFileVersions } from '../../lib/audit'
import { Badge } from '../ui/Badge'

export function FileVersionHistory({ fileId, onClose }) {
  const [versions, setVersions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!fileId) return
    let active = true
    fetchFileVersions(fileId)
      .then((v) => { if (active) setVersions(v) })
      .catch(() => { if (active) setVersions([]) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [fileId])

  if (!fileId) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-900">Version history</h3>
          <button type="button" onClick={onClose} className="text-sm text-slate-500 hover:text-slate-800">Close</button>
        </div>
        {loading ? (
          <p className="text-sm text-slate-500">Loading…</p>
        ) : versions.length === 0 ? (
          <p className="text-sm text-slate-500">No version history.</p>
        ) : (
          <ul className="space-y-2">
            {versions.map((v) => (
              <li key={v.id} className="text-sm border-b border-slate-100 pb-2">
                <div className="flex items-center gap-2">
                  <Badge variant={v.version === versions[0]?.version ? 'verified' : 'default'}>v{v.version}</Badge>
                  <span className="text-xs text-slate-500">{v.createdAt ? new Date(v.createdAt).toLocaleString() : ''}</span>
                </div>
                <p className="text-xs text-slate-500 mt-1 font-mono truncate">{v.checksum?.slice(0, 16)}…</p>
                {v.changeNote && <p className="text-xs text-slate-600 mt-0.5">{v.changeNote}</p>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
