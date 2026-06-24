import { useState } from 'react'
import { Card } from '../ui/Card'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'
import { FormField } from '../ui/FormField'
import { Alert } from '../ui/Alert'

const STATUS_VARIANT = {
  open: 'default',
  in_progress: 'primary',
  done: 'verified',
  cancelled: 'warning',
}

const NEXT_STATUS = {
  open: 'in_progress',
  in_progress: 'done',
}

export function TaskList({ tasks, loading, canCreate, onCreate, onStatusChange, defaultAssigneeSide = 'ngo' }) {
  const [form, setForm] = useState({ title: '', description: '', assigneeSide: defaultAssigneeSide, dueDate: '' })
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState(null)
  const [updatingId, setUpdatingId] = useState(null)

  async function handleCreate(e) {
    e.preventDefault()
    if (!form.title.trim()) return
    setCreating(true)
    setError(null)
    try {
      await onCreate({
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        assigneeSide: form.assigneeSide,
        dueDate: form.dueDate || undefined,
      })
      setForm({ title: '', description: '', assigneeSide: defaultAssigneeSide, dueDate: '' })
    } catch (err) {
      setError(err.message || 'Failed to create task')
    } finally {
      setCreating(false)
    }
  }

  async function advanceStatus(task) {
    const next = NEXT_STATUS[task.status]
    if (!next) return
    setUpdatingId(task.id)
    try {
      await onStatusChange(task.id, next)
    } finally {
      setUpdatingId(null)
    }
  }

  if (loading) {
    return <Card><p className="text-sm text-slate-500">Loading tasks…</p></Card>
  }

  return (
    <Card>
      <h3 className="font-semibold text-slate-900 mb-4">Project Tasks</h3>
      {error && <Alert variant="error" className="mb-3">{error}</Alert>}

      {tasks.length === 0 ? (
        <p className="text-sm text-slate-500 mb-4">No tasks assigned yet.</p>
      ) : (
        <ul className="space-y-3 mb-6">
          {tasks.map((t) => (
            <li key={t.id} className="flex flex-col sm:flex-row sm:items-center gap-3 border-b border-slate-100 pb-3 last:border-0">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-slate-900">{t.title}</p>
                {t.description && <p className="text-xs text-slate-500 mt-0.5">{t.description}</p>}
                <p className="text-xs text-slate-400 mt-1">
                  Assigned to {t.assigneeSide}
                  {t.dueDate && ` · Due ${t.dueDate}`}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Badge variant={STATUS_VARIANT[t.status] || 'default'}>{t.status.replace('_', ' ')}</Badge>
                {NEXT_STATUS[t.status] && (
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={updatingId === t.id}
                    onClick={() => advanceStatus(t)}
                  >
                    {updatingId === t.id ? '…' : `Mark ${NEXT_STATUS[t.status].replace('_', ' ')}`}
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {canCreate && onCreate && (
        <form onSubmit={handleCreate} className="border-t border-slate-100 pt-4 space-y-3">
          <p className="text-sm font-medium text-slate-900">Assign new task</p>
          <FormField label="Title">
            <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} required />
          </FormField>
          <FormField label="Description">
            <Input value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          </FormField>
          <FormField label="Assign to">
            <Select value={form.assigneeSide} onChange={(e) => setForm((f) => ({ ...f, assigneeSide: e.target.value }))}>
              <option value="ngo">NGO</option>
              <option value="corporate">Corporate</option>
            </Select>
          </FormField>
          <FormField label="Due date">
            <Input type="date" value={form.dueDate} onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))} />
          </FormField>
          <Button type="submit" size="sm" disabled={creating}>{creating ? 'Creating…' : 'Create task'}</Button>
        </form>
      )}
    </Card>
  )
}
