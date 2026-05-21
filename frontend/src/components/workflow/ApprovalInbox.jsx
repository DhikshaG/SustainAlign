import { useState, useEffect } from 'react'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { Textarea } from '../ui/Textarea'
import { WorkflowStatusBadge } from './WorkflowStatusBadge'
import { fetchWorkflowInbox, transitionWorkflow } from '../../lib/workflow'

export function ApprovalInbox({ onUpdate }) {
  const [items, setItems] = useState([])
  const [comment, setComment] = useState({})
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    try {
      const res = await fetchWorkflowInbox()
      setItems(res.data?.items || [])
    } catch {
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let active = true
    ;(async () => {
      setLoading(true)
      try {
        const res = await fetchWorkflowInbox()
        if (active) setItems(res.data?.items || [])
      } catch {
        if (active) setItems([])
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => { active = false }
  }, [])

  async function act(id, action) {
    await transitionWorkflow(id, action, comment[id] || '')
    await load()
    onUpdate?.()
  }

  if (loading) return <p className="text-sm text-slate-500">Loading approvals…</p>
  if (!items.length) return <p className="text-sm text-slate-500">No pending approvals</p>

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <Card key={item.id} padding>
          <div className="flex items-start justify-between gap-4 mb-3">
            <div>
              <p className="font-medium text-slate-900">{item.entityType} · {item.entityId.slice(0, 8)}</p>
              <p className="text-xs text-slate-500">
                Step {item.currentStepIndex + 1} of {item.definition?.steps?.length || '?'}
              </p>
            </div>
            <WorkflowStatusBadge status={item.status} />
          </div>
          {item.status === 'pending' && (
            <>
              <Textarea
                placeholder="Comment (optional)"
                value={comment[item.id] || ''}
                onChange={(e) => setComment((c) => ({ ...c, [item.id]: e.target.value }))}
                className="mb-3"
              />
              <div className="flex flex-wrap gap-2">
                <Button size="sm" onClick={() => act(item.id, 'approve')}>Approve</Button>
                <Button size="sm" variant="secondary" onClick={() => act(item.id, 'request_revision')}>Needs revision</Button>
                <Button size="sm" variant="ghost" onClick={() => act(item.id, 'reject')}>Reject</Button>
              </div>
            </>
          )}
        </Card>
      ))}
    </div>
  )
}
