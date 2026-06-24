import { useState, useEffect } from 'react'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { fetchTagCategories, fetchEntityTags, saveEntityTags } from '../../lib/tags'

export function TagPicker({ entityType, entityId, readOnly = false }) {
  const [categories, setCategories] = useState([])
  const [selected, setSelected] = useState(new Set())
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null)

  useEffect(() => {
    Promise.all([fetchTagCategories(), fetchEntityTags(entityType, entityId)])
      .then(([cats, entity]) => {
        setCategories(cats.data?.categories || [])
        setSelected(new Set((entity.data?.tags || []).map((t) => t.id)))
      })
      .catch(() => {})
  }, [entityType, entityId])

  function toggle(tagId) {
    if (readOnly) return
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(tagId)) next.delete(tagId)
      else next.add(tagId)
      return next
    })
  }

  async function save() {
    setSaving(true)
    setMessage(null)
    try {
      await saveEntityTags(entityType, entityId, [...selected])
      setMessage('Tags saved')
    } catch (err) {
      setMessage(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      {categories.map((cat) => (
        <div key={cat.id}>
          <p className="text-sm font-medium text-slate-700 mb-2">{cat.name}</p>
          <div className="flex flex-wrap gap-2">
            {cat.tags.map((tag) => (
              <button
                key={tag.id}
                type="button"
                disabled={readOnly}
                onClick={() => toggle(tag.id)}
                className="focus:outline-none"
              >
                <Badge variant={selected.has(tag.id) ? 'verified' : 'default'}>{tag.label}</Badge>
              </button>
            ))}
          </div>
        </div>
      ))}
      {!readOnly && (
        <div className="flex items-center gap-3">
          <Button size="sm" disabled={saving} onClick={save}>{saving ? 'Saving…' : 'Save tags'}</Button>
          {message && <span className="text-sm text-slate-500">{message}</span>}
        </div>
      )}
    </div>
  )
}
